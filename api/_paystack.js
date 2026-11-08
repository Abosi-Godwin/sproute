import { createClient } from "@supabase/supabase-js";

const PERIOD_DAYS = 30;

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

export const paymentProblem = tx => {
    if (!tx || tx.status !== "success") return "not_successful";

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
    const userId = await findUserId(db, payment.email);
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
        const start = existingEnd && existingEnd > now ? existingEnd : now;
        const end = new Date(start);
        end.setDate(end.getDate() + PERIOD_DAYS);

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