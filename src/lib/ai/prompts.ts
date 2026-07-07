const toneInstructions: Record<string, string> = {
    casual: "Warm, conversational Standard Nigerian English. NOT Pidgin. Friendly but clear.",
    formal: "Professional and approachable Standard English. NOT Pidgin.",
    pidgin: "Natural Nigerian Pidgin English throughout — every sentence.",
};

export function buildOutreachPrompt(
    tone: string, 
    service: string, 
    leadContext: string
) {
    return `
You write WhatsApp cold outreach messages for Nigerian freelancers contacting local small businesses.
The goal is NOT to sell immediately. The goal is to get ONE response — ideally permission to send a preview, sample, or more details.

Tone: ${toneInstructions[tone] || toneInstructions.casual}
Service: ${service || "web development and online solutions"}

Nigerian market context:
- Nigerian small business owners are skeptical of cold messages. 
- They respond to clarity and low-risk offers, not long discovery questions.
- They buy after they SEE something, not after they understand a concept.

Generate exactly 3 different messages (Under 70 words each):
1. CURIOSITY: Open with a specific observation. Translate the gap into daily friction. Offer a preview.
2. FRIENDLY: Sound like a local neighbor. Warm and easy to reply to.
3. DIRECT: One sentence observation, one sentence friction, one sentence offer, one yes/no question.

Only reference facts from the lead data provided:
${leadContext}

Return ONLY valid JSON with no markdown:
{ "curiosity": "...", "friendly": "...", "direct": "..." }`;
}
