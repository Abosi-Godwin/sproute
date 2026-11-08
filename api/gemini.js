import { createClient } from "@supabase/supabase-js";
import { getPrompt, RESPONSE_SCHEMAS } from "./prompts.js";

const MODEL = "gemini-2.5-flash";
const UPSTREAM_TIMEOUT_MS = 25000;
const MAX_LEAD_DATA = 12000;
const MAX_SERVICE = 200;
const TONES = new Set(["casual", "formal", "pidgin"]);
const UNCOUNTED_SCENARIOS = new Set(["chat_helper_summary"]);
const FREE_AI_LIMIT = 10;
const PRO_AI_LIMIT = 50;

let adminClient = null;

const getAdmin = () => {
    if (adminClient) return adminClient;
    const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    adminClient = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false }
    });
    return adminClient;
};

const fail = (res, status, error, code) =>
    res.status(status).json(code ? { error, code } : { error });

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

const bearerToken = req => {
    const header = req.headers?.authorization ?? "";
    const match = /^Bearer\s+(.+)$/i.exec(header);
    return match ? match[1].trim() : "";
};

const isActivePro = row =>
    Boolean(row) &&
    row.plan === "pro" &&
    row.status === "active" &&
    Boolean(row.current_period_end) &&
    new Date(row.current_period_end) > new Date();

export default async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");

    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return fail(res, 405, "Method not allowed");
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const db = getAdmin();

    if (!apiKey || !db) {
        console.error("Missing server configuration", {
            gemini: Boolean(apiKey),
            supabase: Boolean(db)
        });
        return fail(res, 500, "AI is not configured");
    }

    const token = bearerToken(req);
    if (!token) {
        return fail(res, 401, "Please sign in again", "unauthorized");
    }

    const { data: authData, error: authError } = await db.auth.getUser(token);
    const user = authData?.user;
    if (authError || !user) {
        return fail(res, 401, "Please sign in again", "unauthorized");
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

    const counted = !UNCOUNTED_SCENARIOS.has(scenario);
    let used = null;
    let limit = null;

    if (counted) {
        const { data: sub, error: subError } = await db
            .from("subscriptions")
            .select("plan, status, current_period_end")
            .eq("user_id", user.id)
            .maybeSingle();

        if (subError) {
            console.error("Subscription lookup failed:", subError.message);
            return fail(
                res,
                500,
                "Could not check your plan. Try again",
                "usage_check_failed"
            );
        }

        limit = isActivePro(sub) ? PRO_AI_LIMIT : FREE_AI_LIMIT;

        const { data: rows, error: usageError } = await db.rpc(
            "consume_ai_generation",
            { p_user: user.id, p_limit: limit }
        );
        const row = Array.isArray(rows) ? rows[0] : null;

        if (usageError || !row) {
            console.error("Usage check failed:", usageError?.message ?? "no row");
            return fail(
                res,
                500,
                "Could not check your usage. Try again",
                "usage_check_failed"
            );
        }

        used = row.used;

        if (!row.allowed) {
            return res.status(429).json({
                error: "You have used all your AI generations for today",
                code: "limit_reached",
                used,
                limit
            });
        }
    }

    let refunded = false;
    const refund = async () => {
        if (!counted || refunded) return;
        refunded = true;
        const { error } = await db.rpc("refund_ai_generation", {
            p_user: user.id
        });
        if (error) console.error("Refund failed:", error.message);
    };

    const reject = async (status, error) => {
        await refund();
        return fail(res, status, error);
    };

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
            return reject(504, "The AI took too long to respond. Try again");
        }
        console.error("Gemini request failed:", err?.message ?? err);
        return reject(502, "Could not reach the AI service");
    } finally {
        clearTimeout(timer);
    }

    if (!response.ok) {
        console.error(
            "Gemini upstream error:",
            response.status,
            data?.error?.message ?? ""
        );
        return reject(
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
        return reject(502, "The AI returned an empty response. Try again");
    }

    let payload = { text };

    if (schema) {
        try {
            payload = JSON.parse(text);
        } catch {
            console.error(
                "Gemini returned invalid JSON:",
                candidate?.finishReason ?? "",
                text.slice(0, 300)
            );
            return reject(502, "The AI returned an invalid response. Try again");
        }
    }

    if (counted) {
        res.setHeader("X-AI-Used", String(used));
        res.setHeader("X-AI-Limit", String(limit));
    }

    return res.status(200).json(payload);
}