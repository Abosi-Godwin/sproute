import { createClient } from "@supabase/supabase-js";

const PERIOD_DAYS = 30;
const GRACE_DAYS = 3;
const UUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const getAdmin = () => {
    const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    return createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false }
    });
};

export const normalizeEmail = email =>
    typeof email === "string" ? email.trim().toLowerCase() : "";

export const metadataUserId = tx => {
    const id = tx?.metadata?.user_id;
    return typeof id === "string" && UUID.test(id) ? id.toLowerCase() : null;
};

export const planCodeOf = tx => {
    const plan = tx?.plan;
    if (typeof plan === "string" && plan) return plan;
    if (plan && typeof plan === "object" && typeof plan.plan_code === "string") {
        return plan.plan_code;
    }
    const planObject = tx?.plan_object;
    if (
        planObject &&
        typeof planObject === "object" &&
        typeof planObject.plan_code === "string"
    ) {
        return planObject.plan_code;
    }
    return null;
};

export const paymentProblem = tx => {
    if (!tx || tx.status !== "success") return "not_successful";

    if (tx.domain === "test" && process.env.PAYSTACK_ALLOW_TEST !== "true") {
        return "test_mode_payment";
    }

    const minAmount = Number(process.env.PAYSTACK_PRO_AMOUNT_KOBO);
    if (Number.isFinite(minAmount) && minAmount > 0) {
        if (!(Number(tx.amount) >= minAmount)) return "amount_too_low";
    }

    const currency = process.env.PAYSTACK_PRO_CURRENCY;
    if (currency && tx.currency !== currency) return "wrong_currency";

    return null;
};

export const findUserId = async (db, email) => {
    const clean = normalizeEmail(email);
    if (!clean) return null;

    const { data, error } = await db.rpc("get_user_id_by_email", {
        lookup_email: clean
    });
    if (error) throw error;

    return data ?? null;
};

export const grantPro = async (db, payment) => {
    const userId = payment.userId ?? (await findUserId(db, payment.email));
    if (!userId) return { ok: false, reason: "no_user" };

    const { error: claimError } = await db.from("paystack_payments").insert({
        reference: payment.reference,
        user_id: userId,
        amount: payment.amount ?? null,
        currency: payment.currency ?? null,
        source: payment.source
    });

    if (claimError) {
        if (claimError.code === "23505") return { ok: true, duplicate: true };
        if (claimError.code === "23503") return { ok: false, reason: "no_user" };
        throw claimError;
    }

    try {
        const { data: current, error: readError } = await db
            .from("subscriptions")
            .select("current_period_end")
            .eq("user_id", userId)
            .maybeSingle();
        if (readError) throw readError;

        const now = new Date();
        const existingEnd = current?.current_period_end
            ? new Date(current.current_period_end)
            : null;

        let end;
        if (payment.recurring) {
            end = new Date(now);
            end.setDate(end.getDate() + PERIOD_DAYS + GRACE_DAYS);
            if (existingEnd && existingEnd > end) end = existingEnd;
        } else {
            const start = existingEnd && existingEnd > now ? existingEnd : now;
            end = new Date(start);
            end.setDate(end.getDate() + PERIOD_DAYS);
        }

        const row = {
            user_id: userId,
            plan: "pro",
            status: "active",
            current_period_end: end.toISOString()
        };
        if (payment.customerCode) {
            row.paystack_customer_code = payment.customerCode;
        }
        if (payment.subscriptionCode) {
            row.paystack_subscription_code = payment.subscriptionCode;
        }

        const { error: upsertError } = await db
            .from("subscriptions")
            .upsert(row, { onConflict: "user_id" });
        if (upsertError) throw upsertError;
    } catch (err) {
        await db
            .from("paystack_payments")
            .delete()
            .eq("reference", payment.reference);
        throw err;
    }

    return { ok: true, duplicate: false };
};