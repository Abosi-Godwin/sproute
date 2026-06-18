import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { reference } = req.body;
    if (!reference) {
        return res.status(400).json({ message: 'Missing reference' });
    }

    try {
        const verifyRes = await fetch(
            `https://api.paystack.co/transaction/verify/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                },
            }
        );

        const verifyData = await verifyRes.json();

        if (!verifyData.status || verifyData.data.status !== 'success') {
            return res.status(400).json({ message: 'Payment not verified' });
        }

        const email = verifyData.data.customer.email;

        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { data: userId, error: lookupError } = await supabase
            .rpc('get_user_id_by_email', { lookup_email: email });

        if (lookupError) throw lookupError;
        if (!userId) {
            return res.status(404).json({ message: 'No matching user found' });
        }

        const periodEnd = new Date();
        periodEnd.setDate(periodEnd.getDate() + 30);

        const { error: upsertError } = await supabase
            .from('subscriptions')
            .upsert({
                user_id: userId,
                plan: 'pro',
                status: 'active',
                paystack_customer_code: verifyData.data.customer.customer_code,
                current_period_end: periodEnd.toISOString(),
            }, { onConflict: 'user_id' });

        if (upsertError) throw upsertError;

        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Verify error:', err);
        res.status(500).json({ message: 'Verification failed' });
    }
}