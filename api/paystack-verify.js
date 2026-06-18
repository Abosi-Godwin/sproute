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
        console.log('Paystack verify response:', JSON.stringify(verifyData));

        if (!verifyData.status || verifyData.data.status !== 'success') {
            return res.status(400).json({ message: 'Payment not verified', detail: verifyData });
        }

        const email = verifyData.data.customer.email;
        console.log('Resolved email:', email);

        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { data: userId, error: lookupError } = await supabase
            .rpc('get_user_id_by_email', { lookup_email: email });

        console.log('Lookup result:', { userId, lookupError });

        if (lookupError) {
            return res.status(500).json({ message: 'Lookup failed', detail: lookupError });
        }
        if (!userId) {
            return res.status(404).json({ message: 'No matching user found', email });
        }

        const periodEnd = new Date();
        periodEnd.setDate(periodEnd.getDate() + 30);

        const { data: upsertData, error: upsertError } = await supabase
            .from('subscriptions')
            .upsert({
                user_id: userId,
                plan: 'pro',
                status: 'active',
                paystack_customer_code: verifyData.data.customer.customer_code,
                current_period_end: periodEnd.toISOString(),
            }, { onConflict: 'user_id' })
            .select();

        console.log('Upsert result:', { upsertData, upsertError });

        if (upsertError) {
            return res.status(500).json({ message: 'Upsert failed', detail: upsertError });
        }

        res.status(200).json({ success: true, upsertData });
    } catch (err) {
        console.error('Verify error:', err);
        res.status(500).json({ message: 'Verification failed', detail: err.message });
    }
}