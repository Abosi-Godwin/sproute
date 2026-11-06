import { useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router";
import { useUIStore } from "../../lib/stores/useUIStore";
import { useSettingsStore } from "../../lib/stores/useSettingsStore";
import { useSearchStore } from "../../lib/stores/useSearchStore";
import { posthog } from "../../lib/posthog";

import {
    Search,
    BookmarkCheck,
    MessageCircle,
    Sparkles,
    ArrowRight,
    Briefcase,
    MapPin
} from "lucide-react";

const STEP_NAMES = ["welcome", "service", "first_search"];

const OTHER_CITY = "Other city";
const CITIES = ["Asaba", "Lagos", "Port Harcourt", "Abuja", "Enugu"];

const SERVICE_PICKS = [
    "Web development",
    "Photography",
    "Plumbing",
    "Catering",
    "Graphic design",
    "Electrical",
    "Video editing",
    "Social media management"
];

const CATEGORY_SUGGESTIONS: Record<string, string[]> = {
    "Web development": ["Restaurant", "Salon", "Boutique", "Mechanic"],
    Photography: ["Hotel", "Boutique", "Spa", "Bakery"],
    Plumbing: ["Hotel", "School", "Hospital", "Laundry"],
    Catering: ["Church", "School", "Hotel", "Hospital"],
    "Graphic design": ["Boutique", "Bakery", "Salon", "Gym"],
    Electrical: ["Supermarket", "Hotel", "Hospital", "School"],
    "Video editing": ["Church", "Gym", "Hotel", "School"],
    "Social media management": ["Restaurant", "Salon", "Boutique", "Gym"]
};

const DEFAULT_CATEGORIES = ["Restaurant", "Salon", "Boutique", "Pharmacy"];

function Pill({
    active,
    onClick,
    children
}: {
    active: boolean;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                active
                    ? "bg-brand-500/10 text-brand-400"
                    : "bg-base-800 text-base-500 hover:text-base-300"
            }`}
        >
            {children}
        </button>
    );
}

function Welcome({ onNext }: { onNext: () => void }) {
    const steps = [
        {
            icon: Search,
            title: "Search any city",
            description:
                "Find businesses by category: restaurants, salons, pharmacies and more."
        },
        {
            icon: BookmarkCheck,
            title: "Save hot leads",
            description:
                "Sproute scores each business and shows you who is worth contacting first."
        },
        {
            icon: MessageCircle,
            title: "Generate and send",
            description:
                "Get a personalised WhatsApp message written for each business in one tap."
        }
    ];

    return (
        <div className="flex flex-col items-center text-center gap-8">
            <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div className="space-y-2">
                    <h1 className="font-display text-3xl font-bold text-base-50">
                        Welcome to Sproute
                    </h1>
                    <p className="text-base-400 text-base max-w-sm leading-relaxed">
                        Find local businesses, reach out on WhatsApp and land
                        clients, all in one place.
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-5 w-full max-w-sm text-left">
                {steps.map(({ icon: Icon, title, description }) => (
                    <div key={title} className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5 text-brand-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-base-100">
                                {title}
                            </p>
                            <p className="text-xs text-base-500 mt-0.5 leading-relaxed">
                                {description}
                            </p>
                        </div>
                    </div>
                ))}
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

function ServiceStep({
    initial,
    onNext,
    onSkip
}: {
    initial: string;
    onNext: (service: string) => void;
    onSkip: () => void;
}) {
    const { setServiceDescription } = useSettingsStore();
    const [value, setValue] = useState(initial);

    const handleNext = () => {
        const service = value.trim();
        if (!service) return;
        setServiceDescription(service);
        posthog.capture("onboarding_service_set", { service });
        onNext(service);
    };

    return (
        <div className="flex flex-col items-center text-center gap-6 w-full max-w-sm mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center">
                <Briefcase className="w-8 h-8 text-brand-400" />
            </div>
            <div className="space-y-2">
                <h2 className="font-display text-2xl font-bold text-base-50">
                    What do you offer?
                </h2>
                <p className="text-base-400 text-sm max-w-xs leading-relaxed">
                    Sproute uses this to write personalised outreach messages
                    for each business you contact.
                </p>
            </div>

            <div className="w-full space-y-3">
                <input
                    type="text"
                    placeholder="e.g. Web development, Photography, Plumbing..."
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleNext()}
                    className="w-full bg-base-800 border border-base-700 rounded-xl px-4 py-3 text-sm text-base-100 placeholder:text-base-500 focus:outline-none focus:border-brand-500 transition-colors"
                />
                <div className="flex flex-wrap gap-2 justify-center">
                    {SERVICE_PICKS.map(s => (
                        <Pill
                            key={s}
                            active={value === s}
                            onClick={() => setValue(s)}
                        >
                            {s}
                        </Pill>
                    ))}
                </div>
            </div>

            <div className="flex flex-col items-center gap-2 w-full">
                <button
                    onClick={handleNext}
                    disabled={!value.trim()}
                    className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-6 py-3 rounded-xl transition-colors"
                >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                </button>
                <button
                    onClick={onSkip}
                    className="text-xs text-base-500 hover:text-base-300 transition-colors"
                >
                    Skip for now
                </button>
            </div>
        </div>
    );
}

function FirstSearchStep({
    service,
    onFinish,
    onSkip
}: {
    service: string;
    onFinish: (pick: { category: string; city: string }) => void;
    onSkip: () => void;
}) {
    const suggestions = CATEGORY_SUGGESTIONS[service] ?? DEFAULT_CATEGORIES;
    const [category, setCategory] = useState(suggestions[0]);
    const [city, setCity] = useState("");

    return (
        <div className="flex flex-col items-center text-center gap-6 w-full max-w-sm mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-brand-400" />
            </div>
            <div className="space-y-2">
                <h2 className="font-display text-2xl font-bold text-base-50">
                    Find your first leads
                </h2>
                <p className="text-base-400 text-sm max-w-xs leading-relaxed">
                    Pick a business type and a city. We will fill in the search
                    for you.
                </p>
            </div>

            <div className="w-full space-y-5">
                <div className="space-y-2">
                    <p className="text-xs text-base-500">Business type</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                        {suggestions.map(c => (
                            <Pill
                                key={c}
                                active={category === c}
                                onClick={() => setCategory(c)}
                            >
                                {c}
                            </Pill>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-xs text-base-500">City</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                        {[...CITIES, OTHER_CITY].map(c => (
                            <Pill
                                key={c}
                                active={city === c}
                                onClick={() => setCity(c)}
                            >
                                {c}
                            </Pill>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center gap-2 w-full">
                <button
                    onClick={() => onFinish({ category, city })}
                    disabled={!city}
                    className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-6 py-3 rounded-xl transition-colors"
                >
                    Go to search
                    <ArrowRight className="w-4 h-4" />
                </button>
                <button
                    onClick={onSkip}
                    className="text-xs text-base-500 hover:text-base-300 transition-colors"
                >
                    Skip for now
                </button>
            </div>
        </div>
    );
}

export default function OnboardingOverlay() {
    const [step, setStep] = useState(0);
    const { serviceDescription } = useSettingsStore();
    const [service, setService] = useState(serviceDescription ?? "");
    const { setHasOnboarded } = useUIStore();
    const { setQuery, setLocation, setLocationMode } = useSearchStore();
    const navigate = useNavigate();

    useEffect(() => {
        posthog.capture("onboarding_step_viewed", {
            step,
            name: STEP_NAMES[step]
        });
    }, [step]);

    const finish = (pick?: { category: string; city: string }) => {
        if (pick) {
            setQuery(pick.category);
            if (pick.city === OTHER_CITY) {
                setLocationMode("custom");
            } else {
                setLocationMode("quick");
                setLocation(pick.city);
            }
        }

        posthog.capture("onboarding_completed", {
            service_set: Boolean(service.trim()),
            category: pick?.category ?? null,
            city: pick?.city ?? null,
            skipped_first_search: !pick
        });

        setHasOnboarded(true);
        navigate("/search");
    };

    const skipService = () => {
        posthog.capture("onboarding_step_skipped", { name: "service" });
        setStep(2);
    };

    const skipFirstSearch = () => {
        posthog.capture("onboarding_step_skipped", { name: "first_search" });
        finish();
    };

    return (
        <div className="fixed inset-0 z-50 bg-base-950/95 backdrop-blur-sm flex items-center justify-center p-6 overflow-y-auto">
            <div className="absolute top-8 flex items-center gap-2">
                {STEP_NAMES.map((name, i) => (
                    <div
                        key={name}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                            i === step
                                ? "w-6 bg-brand-500"
                                : "w-1.5 bg-base-700"
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
                    {step === 0 && <Welcome onNext={() => setStep(1)} />}
                    {step === 1 && (
                        <ServiceStep
                            initial={service}
                            onNext={s => {
                                setService(s);
                                setStep(2);
                            }}
                            onSkip={skipService}
                        />
                    )}
                    {step === 2 && (
                        <FirstSearchStep
                            service={service}
                            onFinish={finish}
                            onSkip={skipFirstSearch}
                        />
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
