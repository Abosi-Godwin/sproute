import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { getPrompt, RESPONSE_SCHEMAS } from "./prompts.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    try {
        const { scenario, tone, service, leadData } = req.body;

        if (!scenario || !leadData) {
            return res.status(400).json({ error: "Missing scenario or leadData" });
        }

        const systemInstruction = getPrompt(scenario, { tone, service });

        if (!systemInstruction) {
            return res.status(400).json({ error: `Unknown scenario: ${scenario}` });
        }

        const schema = RESPONSE_SCHEMAS[scenario];

        const generationConfig = schema
            ? {
                  responseMimeType: "application/json",
                  responseSchema: {
                      type: SchemaType.OBJECT,
                      properties: Object.fromEntries(
                          Object.entries(schema.properties).map(([k]) => [
                              k,
                              { type: SchemaType.STRING },
                          ])
                      ),
                      required: schema.required,
                  },
              }
            : { responseMimeType: "text/plain" };

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction,
            generationConfig,
        });

        const result = await model.generateContent(`Lead Context: ${leadData}`);
        const textResponse = result.response.text();

        if (schema) {
            return res.status(200).json(JSON.parse(textResponse));
        }

        return res.status(200).json({ text: textResponse });
    } catch (err) {
        console.error("Gemini handler error:", err);
        return res.status(500).json({ error: err.message });
    }
}