import {
    getAdmin,
    grantPro,
    metadataUserId,
    normalizeEmail,
    paymentProblem,
    planCodeOf
} from "./_paystack.js";

const REFERENCE = /^[A-Za-z0-9._=-]{1,100}$/;

const bearerToken = req => {
    const header = req.headers?.authorization ?? "";
    const match = /^Bearer\s+(.+)$/i.exec(header);
    return match ? match[1].trim() : "";
};

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

    const token = bearerToken(req);
    if (!token) {
        return res.status(401).json({ message: "Please sign in again" });
    }

    const { data: authData, error: authError } = await db.auth.getUser(token);
    const user = authData?.user;
    if (authError || !user) {
        return res.status(401).json({ message: "Please sign in again" });
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

        const owner = metadataUserId(tx);
        const emailMatches =
            normalizeEmail(tx.customer?.email) === normalizeEmail(user.email);
        const belongsToUser = owner
            ? owner === String(user.id).toLowerCase()
            : emailMatches;

        if (!belongsToUser) {
            console.error("Payment owner mismatch:", reference);
            return res
                .status(403)
                .json({ message: "Payment belongs to another account" });
        }

        const result = await grantPro(db, {
            userId: user.id,
            reference: typeof tx.reference === "string" ? tx.reference : reference,
            amount: tx.amount,
            currency: tx.currency,
            customerCode: tx.customer?.customer_code,
            recurring: Boolean(planCodeOf(tx)),
            source: "verify"
        });

        if (!result.ok) {
            console.error("Could not apply payment:", reference, result.reason);
            return res.status(404).json({ message: "No matching user found" });
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("Verify error:", err?.message ?? err);
        return res.status(500).json({ message: "Verification failed" });
    }
}