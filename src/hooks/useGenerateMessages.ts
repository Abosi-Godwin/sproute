import { useState } from "react";
import { useLeadsStore } from "../lib/stores/useLeadsStore";
import { useUsageStore } from "../lib/stores/useUsageStore";
import { useSubscriptionStore } from "../lib/stores/useSubscriptionStore";
import { buildOutreachPrompt } from "../lib/ai/prompts";
import { Lead, MessageAngle } from "../types";
import toast from "react-hot-toast";

export interface GeneratedMessage {
    id: string;
    angle: MessageAngle;
    text: string;
}

export function useGenerateMessages(lead: Lead, tone: string, service: string) {
    const { logActivity, saveGeneratedMessage } = useLeadsStore();
    const { canGenerateAi, incrementAiGenerations } = useUsageStore();
    const { isPro } = useSubscriptionStore();
    const pro = isPro();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [showUpgrade, setShowUpgrade] = useState(false);

    const generate = async () => {
        if (!canGenerateAi(pro)) {
            setShowUpgrade(true);
            return null;
        }

        setIsLoading(true);
        setError("");

        try {
            const leadContext = `
                Business: ${lead.name}
                Category: ${lead.category}
                Location: ${lead.address || "unknown"}
                Has website: ${lead.website ? "yes" : "no"}
                Rating: ${lead.rating ?? "unknown"}
                Reviews: ${lead.reviews ?? "unknown"}
                Notes: ${lead.notes || "none"}
            `;

            const res = await fetch("/api/gemini", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    scenario: "message_generator",
                    tone,
                    service,
                    leadData: leadContext
                })
            });

            console.log("res", res.json());

            if (!res.ok) throw new Error("Generation failed");

            const data = await res.json();
            console.log("data", data);

            const generated: GeneratedMessage[] = [
                { id: "curiosity", angle: "curiosity", text: data.curiosity },
                { id: "friendly", angle: "friendly", text: data.friendly },
                { id: "direct", angle: "direct", text: data.direct }
            ];

            saveGeneratedMessage(lead.id, JSON.stringify(data));
            incrementAiGenerations();
            return generated;
        } catch (err: any) {
            setError(err.message || "Failed to generate messages");
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    return { generate, isLoading, error, showUpgrade, setShowUpgrade, pro };
}
