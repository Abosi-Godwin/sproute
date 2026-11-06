import { useRef, useState } from "react";
import { useLeadsStore } from "../lib/stores/useLeadsStore";
import { useUsageStore } from "../lib/stores/useUsageStore";
import { useSubscriptionStore } from "../lib/stores/useSubscriptionStore";
import { painPointsToContext } from "../utils/painPoints";
import { posthog } from "../lib/posthog";
import { Lead, MessageAngle } from "../types";

export interface GeneratedMessage {
    id: string;
    angle: MessageAngle;
    text: string;
}

const TIMEOUT_MS = 45000;
const GENERIC_ERROR = "Generation failed. Try again";

const messageForStatus = (status: number) =>
    status === 429
        ? "The AI is busy right now. Try again in a minute"
        : GENERIC_ERROR;

export function useGenerateMessages(lead: Lead, tone: string, service: string) {
    const { saveGeneratedMessage } = useLeadsStore();
    const { canGenerateAi, incrementAiGenerations } = useUsageStore();
    const { isPro } = useSubscriptionStore();
    const pro = isPro();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [showUpgrade, setShowUpgrade] = useState(false);
    const inFlight = useRef(false);

    const generate = async (): Promise<GeneratedMessage[] | null> => {
        if (inFlight.current) return null;

        if (!canGenerateAi(pro)) {
            setShowUpgrade(true);
            return null;
        }

        inFlight.current = true;
        setIsLoading(true);
        setError("");

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
        const startedAt = Date.now();

        try {
            const leadContext = [
                `Business: ${lead.name}`,
                `Category: ${lead.category}`,
                `Location: ${lead.address || "unknown"}`,
                `Has website: ${lead.website ? "yes" : "no"}`,
                `Rating: ${lead.rating ?? "unknown"}`,
                `Reviews: ${lead.reviews ?? "unknown"}`,
                `Business signals: ${
                    lead.painPoints
                        ? painPointsToContext(lead.painPoints)
                        : "No specific signals"
                }`,
                `Notes: ${lead.notes || "none"}`
            ].join("\n");

            const res = await fetch("/api/gemini", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                signal: controller.signal,
                body: JSON.stringify({
                    scenario: "message_generator",
                    tone,
                    service: service.trim() || "web development",
                    leadData: leadContext
                })
            });

            let data: any = null;
            try {
                data = await res.json();
            } catch {
                data = null;
            }

            if (!res.ok) {
                posthog.capture("generation_request_failed", {
                    lead_id: lead.id,
                    status: res.status,
                    detail: typeof data?.error === "string" ? data.error : "",
                    duration_ms: Date.now() - startedAt
                });
                setError(messageForStatus(res.status));
                return null;
            }

            const texts = [data?.curiosity, data?.friendly, data?.direct];
            const complete = texts.every(
                t => typeof t === "string" && t.trim().length > 0
            );

            if (!complete) {
                posthog.capture("generation_request_failed", {
                    lead_id: lead.id,
                    status: res.status,
                    detail: "incomplete_response",
                    duration_ms: Date.now() - startedAt
                });
                setError(GENERIC_ERROR);
                return null;
            }

            const curiosity = data.curiosity.trim();
            const friendly = data.friendly.trim();
            const direct = data.direct.trim();

            const generated: GeneratedMessage[] = [
                { id: "curiosity", angle: "curiosity", text: curiosity },
                { id: "friendly", angle: "friendly", text: friendly },
                { id: "direct", angle: "direct", text: direct }
            ];

            saveGeneratedMessage(
                lead.id,
                JSON.stringify({ curiosity, friendly, direct })
            );
            incrementAiGenerations();

            return generated;
        } catch (err: any) {
            const timedOut = err?.name === "AbortError";
            const offline = err instanceof TypeError;

            posthog.capture("generation_request_failed", {
                lead_id: lead.id,
                status: 0,
                detail: timedOut ? "timeout" : err?.message ?? "",
                duration_ms: Date.now() - startedAt
            });

            setError(
                timedOut
                    ? "That took too long. Try again"
                    : offline
                      ? "No connection. Check your network and try again"
                      : GENERIC_ERROR
            );
            return null;
        } finally {
            clearTimeout(timer);
            inFlight.current = false;
            setIsLoading(false);
        }
    };

    return { generate, isLoading, error, showUpgrade, setShowUpgrade, pro };
}