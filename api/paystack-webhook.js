import crypto from "crypto";
import { getAdmin, grantPro, paymentProblem, findUserId } from "./_paystack.js";

const signatureValid = (body, signature, secret) => {
    if (typeof signature !== "string") return false;

    const expected = crypto
        .createHmac("sha512", secret)
        .update(JSON.stringify(body))
        .digest("hex");

    const a = Buffer.from(expected);
    const b = Buffer.from(signature);

    return a.length === b.length && crypto.timingSafeEqual(a, b);
};

export default async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");

    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ message: "Method not allowed" });
    }

    const secret = process.env.PAYSTACK_SECRET_KEY;
    const db = getAdmin();

    if (!secret || !db) {
        console.error("Paystack webhook is not configured", {
            paystack: Boolean(secret),
            supabase: Boolean(db)
        });
        return res.status(500).json({ message: "Webhook not configured" });
    }

    if (!req.body || typeof req.body !== "object") {
        return res.status(400).json({ message: "Invalid body" });
    }

    if (!signatureValid(req.body, req.headers["x-paystack-signature"], secret)) {
        return res.status(401).json({ message: "Invalid signature" });
    }

    const { event, data } = req.body;

    try {
        if (event === "charge.success") {
            const reference =
                typeof data?.reference === "string" ? data.reference : "";

            if (!reference) {
                console.error("Charge without reference");
                return res.status(200).json({ received: true });
            }

            const problem = paymentProblem(data);
            if (problem) {
                console.error("Ignored charge:", problem, reference);
                return res.status(200).json({ received: true });
            }

            const result = await grantPro(db, {
                reference,
                email: data.customer?.email,
                amount: data.amount,
                currency: data.currency,
                customerCode: data.customer?.customer_code,
                subscriptionCode: data.subscription_code,
                source: "webhook"
            });

            if (!result.ok) {
                console.error("Paid but no matching user:", reference);
            }
        }

        if (event === "subscription.create") {
            const code = data?.subscription_code;
            const userId = code
                ? await findUserId(db, data?.customer?.email)
                : null;

            if (userId) {
                await db
                    .from("subscriptions")
                    .update({ paystack_subscription_code: code })
                    .eq("user_id", userId);
            }
        }

        return res.status(200).json({ received: true });
    } catch (err) {
        console.error("Webhook error:", err?.message ?? err);
        return res.status(500).json({ message: "Webhook processing failed" });
    }
}