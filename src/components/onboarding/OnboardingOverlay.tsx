import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router';
import { useUIStore } from '../../lib/stores/useUIStore';
import { Search, BookmarkCheck, MessageCircle, Sparkles, ArrowRight } from 'lucide-react';

const steps = [
  {
    id: 1,
    component: Step1,
  },
  {
    id: 2,
    component: Step2,
  },
  {
    id: 3,
    component: Step3,
  },
];

function Step1({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center text-center gap-6">
      <div className="w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-white" />
      </div>
      <div className="space-y-3">
        <h1 className="font-display text-3xl font-bold text-base-50">
          Welcome to Sproute
        </h1>
        <p className="text-base-400 text-base max-w-sm leading-relaxed">
          Find local businesses, track your outreach, and land new clients — all in one place.
        </p>
      </div>
      <button
        onClick={onNext}
        className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-medium px-6 py-3 rounded-xl transition-colors"
      >
        Get Started
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function Step2({ onNext }: { onNext: () => void }) {
  const items = [
    {
      icon: Search,
      title: 'Search any city',
      description: 'Find businesses in any category — restaurants, salons, pharmacies and more.',
    },
    {
      icon: BookmarkCheck,
      title: 'Save your leads',
      description: 'Keep track of every business you want to reach out to in one organised list.',
    },
    {
      icon: MessageCircle,
      title: 'Generate outreach',
      description: 'Get a personalised WhatsApp message written for each business in one click.',
    },
  ];

  return (
    <div className="flex flex-col items-center text-center gap-8">
      <div className="space-y-2">
        <h2 className="font-display text-2xl font-bold text-base-50">How it works</h2>
        <p className="text-base-400 text-sm">Three steps to your next client.</p>
      </div>

      <div className="flex flex-col gap-5 w-full max-w-sm text-left">
        {items.map(({ icon: Icon, title, description }, i) => (
          <div key={i} className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-base-100">{title}</p>
              <p className="text-xs text-base-500 mt-0.5 leading-relaxed">{description}</p>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onNext}
        className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-medium px-6 py-3 rounded-xl transition-colors"
      >
        Next
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function Step3({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="flex flex-col items-center text-center gap-6">
      <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center">
        <span className="text-4xl">🌱</span>
      </div>
      <div className="space-y-3">
        <h2 className="font-display text-2xl font-bold text-base-50">
          You're all set
        </h2>
        <p className="text-base-400 text-base max-w-sm leading-relaxed">
          Your next client is one search away.
        </p>
      </div>
      <button
        onClick={onFinish}
        className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-medium px-6 py-3 rounded-xl transition-colors"
      >
        Start Prospecting
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function OnboardingOverlay() {
  const [step, setStep] = useState(0);
  const { setHasOnboarded } = useUIStore();
  const navigate = useNavigate();

  const handleFinish = () => {
    setHasOnboarded(true);
    navigate('/search');
  };

  const StepComponents = [
    <Step1 onNext={() => setStep(1)} />,
    <Step2 onNext={() => setStep(2)} />,
    <Step3 onFinish={handleFinish} />,
  ];

  return (
    <div className="fixed inset-0 z-50 bg-base-950/95 backdrop-blur-sm flex items-center justify-center p-6">
      {/* Progress dots */}
      <div className="absolute top-8 flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === step ? 'w-6 bg-brand-500' : 'w-1.5 bg-base-700'
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-md"
        >
          {StepComponents[step]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}