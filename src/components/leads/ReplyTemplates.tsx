 import { useState } from 'react';
import { Check, Copy, MessageCircle } from 'lucide-react';
import { Lead } from '../../types';
import { useSettingsStore } from '../../lib/stores/useSettingsStore';

interface Template {
  id: string;
  label: string;
  scenario: string;
  casual: string;
  pidgin: string;
}

const getTemplates = (service: string): Template[] => [
  {
    id: 'interested',
    label: 'They are interested',
    scenario: 'Business replied positively',
    casual: `Hi [Business Name], glad to hear that! I've helped similar businesses with ${service || 'what I do'} and they started seeing results quickly. Let me send you some examples — would that work?`,
    pidgin: `Hi [Business Name], e good say you interested! I don help businesses like una with ${service || 'wetin I dey do'} before, dem start see results quick quick. Make I send you some examples — that go work for you?`,
  },
  {
    id: 'price',
    label: 'They asked for price',
    scenario: 'Business wants to know cost',
    casual: `Hi [Business Name], the price depends on what you need exactly. Can we do a quick call so I understand what you want and give you an accurate number?`,
    pidgin: `Hi [Business Name], e depend on wetin you need exactly. Make we do quick call so I understand wetin you want give you correct price?`,
  },
  {
    id: 'followup',
    label: 'No response after 3 days',
    scenario: 'Following up on unanswered message',
    casual: `Hi [Business Name], just checking if you saw my last message. Still happy to help if you're interested.`,
    pidgin: `Hi [Business Name], just dey check if you see my last message. I still dey available if you go interested.`,
  },
  {
    id: 'notnow',
    label: 'They said not now',
    scenario: 'Business is not ready yet',
    casual: `Hi [Business Name], no problem at all. Whenever you're ready, I'm here. Feel free to reach out anytime.`,
    pidgin: `Hi [Business Name], no wahala at all. Anytime you ready, I dey here. Just reach out whenever.`,
  },
  {
    id: 'autoreply',
    label: 'They sent an auto-reply',
    scenario: 'Got an automated response',
    casual: `Hi [Business Name], I know this might be an automated reply. Whenever a real person sees this, I'd love to talk about how I can help with ${service || 'my services'}. No rush — just reach out when you're free.`,
    pidgin: `Hi [Business Name], I know say this message fit be automatic reply. Whenever real person see this one, I go love make we talk about how I fit help una with ${service || 'wetin I dey do'}. No rush — just reach out when you ready.`,
  },
];

interface ReplyTemplatesProps {
  lead: Lead;
  tone: 'casual' | 'formal' | 'pidgin';
}

export default function ReplyTemplates({ lead, tone }: ReplyTemplatesProps) {
  const { serviceDescription } = useSettingsStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const TEMPLATES = getTemplates(serviceDescription);

  const getTemplate = (template: Template) => {
    const text = tone === 'pidgin' ? template.pidgin : template.casual;
    return text.replace(/\[Business Name\]/g, lead.name);
  };

  const copy = (template: Template) => {
    navigator.clipboard.writeText(getTemplate(template));
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openWhatsApp = (template: Template) => {
    if (!lead.phone) return;
    const phone = lead.phone.replace(/\D/g, '');
    const text = getTemplate(template);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="bg-base-900 border border-base-800 rounded-xl p-5 space-y-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-brand-400" />
          <h3 className="font-display font-semibold text-base-100">Reply Templates</h3>
        </div>
        <span className="text-xs text-base-500">
          {expanded ? 'Hide' : 'Show'}
        </span>
      </button>

      {expanded && (
        <div className="space-y-3">
          <p className="text-xs text-base-500">
            Tap a template based on what happened. It auto-fills the business name.
          </p>

          {TEMPLATES.map((template) => (
            <div
              key={template.id}
              className="border border-base-800 rounded-xl p-4 space-y-3"
            >
              <div>
                <p className="text-xs font-semibold text-base-200">{template.label}</p>
                <p className="text-xs text-base-500 mt-0.5">{template.scenario}</p>
              </div>

              <p className="text-xs text-base-400 leading-relaxed">
                {getTemplate(template)}
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copy(template)}
                  className="flex items-center gap-1.5 flex-1 justify-center text-xs font-medium px-3 py-2 rounded-lg bg-base-800 text-base-300 hover:text-base-100 hover:bg-base-700 transition-colors"
                >
                  {copiedId === template.id
                    ? <><Check className="w-3 h-3 text-brand-400" /> Copied</>
                    : <><Copy className="w-3 h-3" /> Copy</>
                  }
                </button>
                {lead.phone && (
                  <button
                    onClick={() => openWhatsApp(template)}
                    className="flex items-center gap-1.5 flex-1 justify-center text-xs font-medium px-3 py-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                  >
                    <MessageCircle className="w-3 h-3" />
                    WhatsApp
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}