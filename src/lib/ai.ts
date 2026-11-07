import { supabase } from "./supabase";
import { useUsageStore } from "./stores/useUsageStore";

export interface AiResult<T = any> {
    ok: boolean;
    status: number;
    data: T | null;
    error: string;
    limitReached: boolean;
}

export async function callAi<T = any>(
    payload: Record<string, unknown>,
    signal?: AbortSignal
): Promise<AiResult<T>> {
    const {
        data: { session }
    } = await supabase.auth.getSession();

    if (!session) {
        return {
            ok: false,
            status: 401,
            data: null,
            error: "Please sign in again",
            limitReached: false
        };
    }

    const res = await fetch("/api/gemini", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`
        },
        signal,
        body: JSON.stringify(payload)
    });

    let data: any = null;
    try {
        data = await res.json();
    } catch {
        data = null;
    }

    const usedHeader = res.headers.get("x-ai-used");
    if (res.ok && usedHeader !== null) {
        const used = Number(usedHeader);
        if (Number.isFinite(used)) {
            useUsageStore.getState().syncAiUsage(used);
        }
    }

    const limitReached = res.status === 429 && data?.code === "limit_reached";
    if (limitReached && Number.isFinite(Number(data?.used))) {
        useUsageStore.getState().syncAiUsage(Number(data.used));
    }

    return {
        ok: res.ok,
        status: res.status,
        data: res.ok ? (data as T) : null,
        error: typeof data?.error === "string" ? data.error : "",
        limitReached
    };
}