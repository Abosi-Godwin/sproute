import { useState } from 'react';
import {
  BookOpen, ChevronDown, ChevronUp,
  MessageSquare, Shield, DoorOpen,
  Search, DollarSign, Phone, ThumbsUp
} from 'lucide-react';
import { clsx } from 'clsx';

interface GuideSection {
  id: string;
  title: string;
  icon: React.ElementType;
  content: { heading: string; body: string }[];
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'reach-out',
    title: 'How to Reach Out',
    icon: MessageSquare,
    content: [
      {
        heading: 'Lead with observation, not pitch',
        body: 'Start by showing you actually looked them up. Reference their location, category, or something specific about their business. Never open with what you do — open with what you noticed about them.',
      },
      {
        heading: 'One message, one point',
        body: 'Your first message should make one point only. Not three benefits, not your portfolio, not your price. One specific pain point connected to one solution. Everything else comes after they reply.',
      },
      {
        heading: 'Give them an easy yes',
        body: 'Close with a question that costs them nothing to answer. "Would you be open to hearing more?" is easier to say yes to than "Can we schedule a call?" Save the call for after they show interest.',
      },
    ],
  },
  {
    id: 'professional',
    title: 'Stay Professional',
    icon: Shield,
    content: [
      {
        heading: 'Never over-promise',
        body: 'Do not guarantee results you cannot control. "I\'ll get you 100 customers in a month" will destroy your credibility before you start. Stick to what you can actually deliver — a professional website, better online visibility, faster loading speed.',
      },
      {
        heading: 'Control your emotions',
        body: 'If they ignore you, do not send a follow-up that sounds needy or frustrated. If they reply rudely, do not match their energy. You are a professional. Respond calmly or do not respond at all.',
      },
      {
        heading: 'Keep personal matters out',
        body: 'Never mention that you need the money, that business has been slow, or that this client would really help you. The client is thinking about their own problems — not yours. Keep the conversation focused entirely on them.',
      },
      {
        heading: 'Do not chase',
        body: 'One follow-up after no response is fine. Two is acceptable. Three makes you look desperate. If they have not responded after two follow-ups, mark them and move on. Desperation kills deals before they start.',
      },
    ],
  },
  {
    id: 'rejection',
    title: 'Handling Rejection',
    icon: DoorOpen,
    content: [
      {
        heading: 'No is not personal',
        body: 'They are not rejecting you — they are rejecting the timing, the offer, or the way it was presented. Most businesses that say no today will need your service eventually. How you handle rejection determines whether they come back.',
      },
      {
        heading: 'The right response to no',
        body: '"No problem at all — I completely understand. If anything changes down the line, feel free to reach out." Short, warm, zero pressure. This leaves the door open and makes you memorable as someone who respects their decision.',
      },
      {
        heading: 'Never argue with rejection',
        body: 'If they say they are not interested, do not respond with reasons why they should be. You will not change their mind and you will damage your reputation. Accept it gracefully and move to the next lead.',
      },
      {
        heading: 'Learn from patterns',
        body: 'If many leads are saying the same thing — "too expensive", "not now", "we already have someone" — that is data. It means something in your pitch, pricing, or targeting needs to change. Rejection in bulk is feedback.',
      },
    ],
  },
  {
    id: 'dig-deeper',
    title: 'Getting Them to Open Up',
    icon: Search,
    content: [
      {
        heading: 'Ask about their business, not their website',
        body: 'Instead of "do you want a website", ask "how do most of your customers find you right now?" That question reveals their real problem and positions your solution naturally.',
      },
      {
        heading: 'Questions that unlock real pain',
        body: '"What\'s the biggest challenge you face getting new customers?" — "Have you tried anything to fix that before?" — "What would change for your business if that problem was solved?" These questions get them thinking and talking.',
      },
      {
        heading: 'Listen more than you talk',
        body: 'When they start explaining their problems, stop selling. Just listen and ask follow-up questions. The more they talk, the more they convince themselves they need your help. Your job at this stage is to understand, not to pitch.',
      },
      {
        heading: 'Repeat their words back',
        body: 'When you eventually present your solution, use the exact words they used to describe their problem. "You mentioned customers have trouble finding you — that\'s exactly what a website fixes." This makes them feel deeply understood.',
      },
    ],
  },
  {
    id: 'price',
    title: 'The Price Conversation',
    icon: DollarSign,
    content: [
      {
        heading: 'Never quote without scope',
        body: 'If they ask for price before you understand what they need, redirect: "It depends on exactly what you need — I\'d rather give you an accurate number after understanding your situation. Can I ask a few quick questions?" This is not stalling — it is professional.',
      },
      {
        heading: 'Anchor high, then adjust',
        body: 'Give a range, not a fixed number. "Usually between ₦150k and ₦400k depending on what\'s included." This sets expectations, gives you room to move, and filters out people who cannot afford you before you waste time on proposals.',
      },
      {
        heading: 'Justify before you quote',
        body: 'Before you say any number, remind them of the value — "A website that shows up when people search for your category in your area, looks professional on mobile, and has your menu and contact details could bring in customers 24 hours a day." Then quote. Value first, price second.',
      },
      {
        heading: 'Do not discount immediately',
        body: 'If they say it is too expensive, do not immediately drop your price. Ask what budget they had in mind. Ask what they could do without. Discounting immediately signals that you were overcharging and destroys trust.',
      },
    ],
  },
  {
    id: 'call',
    title: 'Getting Them on a Call',
    icon: Phone,
    content: [
      {
        heading: 'Suggest a specific time',
        body: '"Are you free tomorrow between 10am and 2pm for a quick 10-minute call?" is infinitely better than "let me know when you\'re free." Specific suggestions reduce friction and show you respect their time.',
      },
      {
        heading: 'Keep the call promise short',
        body: 'Say 10 minutes and mean it. If the conversation is going well, ask permission to continue. "I said 10 minutes — are you okay if we go a little longer?" This builds massive trust.',
      },
      {
        heading: 'Have a clear call agenda',
        body: 'Before the call, know exactly what you want to find out: their budget, their timeline, who makes the decision, what they have tried before. A structured conversation makes you look expert and saves time.',
      },
    ],
  },
  {
    id: 'interested',
    title: 'When They Say Yes',
    icon: ThumbsUp,
    content: [
      {
        heading: 'Do not oversell after yes',
        body: 'Once they are interested, stop selling. Shift to discovery — ask questions, understand their needs, and start thinking about the solution. Continuing to pitch after they say yes is a red flag that makes them second-guess themselves.',
      },
      {
        heading: 'Set expectations immediately',
        body: 'Tell them what happens next: "Great — I\'ll send you a few questions to understand what you need, then I\'ll put together a proposal by [date]." Clear next steps prevent the deal from going cold between conversations.',
      },
      {
        heading: 'Get a commitment before you work',
        body: 'Before you spend time on a proposal or mockup, get a verbal commitment on budget and timeline. "Just so I put the right proposal together — roughly what budget were you thinking and when would you want this done?" This filters serious buyers from time wasters.',
      },
      {
        heading: 'Follow up on proposals',
        body: 'If you send a proposal and hear nothing after 3 days, follow up once. "Hi [name], just checking if you had a chance to look at the proposal I sent. Happy to answer any questions." One follow-up is professional. More than that is pressure.',
      },
    ],
  },
];

function Section({ section }: { section: GuideSection }) {
  const [open, setOpen] = useState(false);
  const Icon = section.icon;

  return (
    <div className="border border-base-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-base-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-brand-400" />
          <p className="text-sm font-medium text-base-100">{section.title}</p>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-base-500 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-base-500 shrink-0" />
        }
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-base-800 pt-4">
          {section.content.map((item, i) => (
            <div key={i} className="space-y-1">
              <p className="text-xs font-semibold text-base-200">
                {item.heading}
              </p>
              <p className="text-xs text-base-500 leading-relaxed">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ClosingGuide() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-base-900 border border-base-800 rounded-xl p-5 space-y-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-brand-400" />
          <h3 className="font-display font-semibold text-base-100">
            Sales Playbook
          </h3>
        </div>
        <span className="text-xs text-base-500">
          {expanded ? 'Hide' : 'Show'}
        </span>
      </button>

      {expanded && (
        <div className="space-y-2">
          <p className="text-xs text-base-500">
            A practical guide to converting leads into clients.
          </p>
          {GUIDE_SECTIONS.map((section) => (
            <Section key={section.id} section={section} />
          ))}
        </div>
      )}
    </div>
  );
}