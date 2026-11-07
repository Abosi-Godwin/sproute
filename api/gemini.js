import { getPrompt, RESPONSE_SCHEMAS } from "./prompts.js";

const MODEL = "gemini-2.5-flash";
const UPSTREAM_TIMEOUT_MS = 25000;
const MAX_LEAD_DATA = 12000;
const MAX_SERVICE = 200;
const TONES = new Set(["casual", "formal", "pidgin"]);

const fail = (res, status, error) => res.status(status).json({ error });

const readBody = req => {
    const body = req.body;
    if (body && typeof body === "object") return body;
    if (typeof body === "string") {
        try {
            const parsed = JSON.parse(body);
            return parsed && typeof parsed === "object" ? parsed : {};
        } catch {
            return {};
        }
    }
    return {};
};

const clip = (text, max) =>
    text.length > max ? text.slice(text.length - max) : text;

const upstreamStatus = status => {
    if (status === 429) return 429;
    if (status === 503 || status === 504) return 503;
    return 502;
};

export default async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");

    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return fail(res, 405, "Method not allowed");
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("GEMINI_API_KEY is not set");
        return fail(res, 500, "AI is not configured");
    }

    const { scenario, tone, service, leadData } = readBody(req);

    if (
        typeof scenario !== "string" ||
        typeof leadData !== "string" ||
        !leadData.trim()
    ) {
        return fail(res, 400, "Missing scenario or leadData");
    }

    const cleanTone = TONES.has(tone) ? tone : "casual";
    const cleanService =
        (typeof service === "string"
            ? service.trim().slice(0, MAX_SERVICE)
            : "") || "web development";

    const systemInstruction = getPrompt(scenario, {
        tone: cleanTone,
        service: cleanService
    });

    if (!systemInstruction) {
        return fail(res, 400, "Unknown scenario");
    }

    const schema = RESPONSE_SCHEMAS[scenario];

    const generationConfig = {
        maxOutputTokens: 2048,
        thinkingConfig: { thinkingBudget: 0 }
    };

    if (schema) {
        generationConfig.responseMimeType = "application/json";
        generationConfig.responseSchema = schema;
    }

    const body = {
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [
            {
                parts: [
                    {
                        text: `Lead Context: ${clip(leadData, MAX_LEAD_DATA)}`
                    }
                ]
            }
        ],
        generationConfig
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

    let response;
    let data;

    try {
        response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": apiKey
                },
                signal: controller.signal,
                body: JSON.stringify(body)
            }
        );
        data = await response.json().catch(() => null);
    } catch (err) {
        if (err?.name === "AbortError") {
            return fail(res, 504, "The AI took too long to respond. Try again");
        }
        console.error("Gemini request failed:", err?.message ?? err);
        return fail(res, 502, "Could not reach the AI service");
    } finally {
        clearTimeout(timer);
    }

    if (!response.ok) {
        console.error(
            "Gemini upstream error:",
            response.status,
            data?.error?.message ?? ""
        );
        return fail(
            res,
            upstreamStatus(response.status),
            response.status === 429
                ? "The AI is busy right now. Try again in a minute"
                : "The AI service had a problem. Try again"
        );
    }

    const candidate = data?.candidates?.[0];
    const parts = candidate?.content?.parts ?? [];
    const text = parts
        .filter(p => !p.thought && typeof p.text === "string")
        .map(p => p.text)
        .join("")
        .trim();

    if (!text) {
        console.error(
            "Gemini returned no text:",
            data?.promptFeedback?.blockReason ??
                candidate?.finishReason ??
                "empty"
        );
        return fail(res, 502, "The AI returned an empty response. Try again");
    }

    if (schema) {
        try {
            return res.status(200).json(JSON.parse(text));
        } catch {
            console.error(
                "Gemini returned invalid JSON:",
                candidate?.finishReason ?? "",
                text.slice(0, 300)
            );
            return fail(
                res,
                502,
                "The AI returned an invalid response. Try again"
            );
        }
    }

    return res.status(200).json({ text });
}