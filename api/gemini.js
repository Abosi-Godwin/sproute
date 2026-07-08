import { getPrompt, RESPONSE_SCHEMAS } from "../src/utils/prompts";

export default async function handler(req, res) {
  console.log(req,res)
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    try {
        const { scenario, tone, service, leadData } = req.body;
        console.log(scenario, tone, service, leadData);
        if (!scenario || !leadData) {
            return res
                .status(400)
                .json({ error: "Missing scenario or leadData" });
        }

        const systemInstruction = getPrompt(scenario, { tone, service });

        if (!systemInstruction) {
            return res
                .status(400)
                .json({ error: `Unknown scenario: ${scenario}` });
        }

        const schema = RESPONSE_SCHEMAS[scenario];

        const body = {
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents: [{ parts: [{ text: `Lead Context: ${leadData}` }] }]
        };

        if (schema) {
            body.generationConfig = {
                responseMimeType: "application/json",
                responseSchema: schema
            };
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                error: data.error?.message ?? "Gemini request failed"
            });
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

        if (!text) {
            return res
                .status(500)
                .json({ error: "Empty response from Gemini" });
        }

        if (schema) {
            try {
                return res.status(200).json(JSON.parse(text));
            } catch (parseError) {
                console.error("Failed to parse Gemini JSON:", text);
                return res.status(500).json({
                    error: "Gemini generated invalid JSON. Please try again."
                });
            }
        }

        return res.status(200).json({ text });
    } catch (err) {
        console.error("Gemini handler error:", err);
        return res.status(500).json({ error: err.message });
    }
}
console.log(handler)