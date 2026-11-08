import { getAdmin, grantPro, paymentProblem } from "./_paystack.js";

const REFERENCE = /^[A-Za-z0-9._=-]{1,100}$/;

export default async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");

    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ message: "Method not allowed" });
    }

    const body = req.body && typeof req.body === "object" ? req.body : {};
    const reference =
        typeof body.reference === "string" ? body.reference.trim() : "";

    if (!REFERENCE.test(reference)) {
        return res.status(400).json({ message: "Missing reference" });
    }

    const secret = process.env.PAYSTACK_SECRET_KEY;
    const db = getAdmin();

    if (!secret || !db) {
        console.error("Paystack verify is not configured", {
            paystack: Boolean(secret),
            supabase: Boolean(db)
        });
        return res.status(500).json({ message: "Verification failed" });
    }

    try {
        const verifyRes = await fetch(
            `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
            { headers: { Authorization: `Bearer ${secret}` } }
        );
        const verifyData = await verifyRes.json().catch(() => null);
        const tx = verifyData?.data;

        if (!verifyRes.ok || !verifyData?.status || !tx) {
            return res.status(400).json({ message: "Payment not verified" });
        }

        const problem = paymentProblem(tx);
        if (problem) {
            console.error("Payment rejected:", problem, reference);
            return res.status(400).json({ message: "Payment not verified" });
        }

        const result = await grantPro(db, {
            reference,
            email: tx.customer?.email,
            amount: tx.amount,
            currency: tx.currency,
            customerCode: tx.customer?.customer_code,
            source: "verify"
        });

        if (!result.ok) {
            console.error("Paid but no matching user:", reference);
            return res.status(404).json({ message: "No matching user found" });
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("Verify error:", err?.message ?? err);
        return res.status(500).json({ message: "Verification failed" });
    }
}