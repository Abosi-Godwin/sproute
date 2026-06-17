const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const hash = crypto
        .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
        .update(JSON.stringify(req.body))
        .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
        return res.status(401).json({ message: 'Invalid signature' });
    }

    const { event, data } = req.body;

    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        if (event === 'charge.success' || event === 'subscription.create') {
            const email = data.customer?.email;
            if (!email) return res.status(200).json({ received: true });

            const { data: userId, error: lookupError } = await supabase
                .rpc('get_user_id_by_email', { lookup_email: email });

            if (lookupError) throw lookupError;
            if (!userId) {
                return res.status(200).json({ received: true, note: 'No matching user' });
            }

            const periodEnd = new Date();
            periodEnd.setDate(periodEnd.getDate() + 30);

            await supabase.from('subscriptions').upsert({
                user_id: userId,
                plan: 'pro',
                status: 'active',
                paystack_customer_code: data.customer.customer_code,
                paystack_subscription_code: data.subscription_code ?? null,
                current_period_end: periodEnd.toISOString(),
            }, { onConflict: 'user_id' });
        }

        if (event === 'subscription.disable' || event === 'subscription.not_renew') {
            const email = data.customer?.email;
            if (!email) return res.status(200).json({ received: true });

            const { data: userId } = await supabase
                .rpc('get_user_id_by_email', { lookup_email: email });

            if (userId) {
                await supabase.from('subscriptions')
                    .update({ plan: 'free', status: 'cancelled' })
                    .eq('user_id', userId);
            }
        }

        res.status(200).json({ received: true });
    } catch (err) {
        console.error('Webhook error:', err);
        res.status(500).json({ message: 'Webhook processing failed' });
    }
};