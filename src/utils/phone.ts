const NIGERIA = "234";
const MOBILE_NSN = /^[789]\d{9}$/;

export function toWhatsAppNumber(raw?: string | null): string | null {
    if (!raw) return null;
    const text = raw.trim();
    if (!text) return null;

    let digits = text.replace(/\D/g, "");
    if (!digits) return null;

    const international = text.startsWith("+") || digits.startsWith("00");
    if (digits.startsWith("00")) digits = digits.slice(2);

    if (digits.startsWith(NIGERIA)) {
        let national = digits.slice(NIGERIA.length);
        if (national.startsWith("0")) national = national.slice(1);
        return MOBILE_NSN.test(national) ? NIGERIA + national : null;
    }

    if (international) {
        return digits.length >= 8 && digits.length <= 15 ? digits : null;
    }

    if (digits.startsWith("0")) {
        const national = digits.slice(1);
        return MOBILE_NSN.test(national) ? NIGERIA + national : null;
    }

    if (MOBILE_NSN.test(digits)) return NIGERIA + digits;

    if (digits.length >= 11 && digits.length <= 15) return digits;

    return null;
}

export function pickWhatsAppNumber(lead: {
    whatsappNumber?: string | null;
    phone?: string | null;
}): string | null {
    return (
        toWhatsAppNumber(lead.whatsappNumber) ?? toWhatsAppNumber(lead.phone)
    );
}

export function whatsAppUrl(number: string, text?: string): string {
    const base = `https://wa.me/${number}`;
    return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function openWhatsApp(number: string, text?: string) {
    window.open(whatsAppUrl(number, text), "_blank", "noopener,noreferrer");
}

export function formatInternational(number: string): string {
    if (number.startsWith("234") && number.length === 13) {
        return `+234 ${number.slice(3, 6)} ${number.slice(6, 9)} ${number.slice(9)}`;
    }
    return `+${number}`;
}