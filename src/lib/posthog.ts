import posthog from "posthog-js";

export function initPostHog() {
    posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
        api_host: import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com",
        capture_pageview: false,
        capture_pageleave: true,
        session_recording: {
            maskAllInputs: true,
        },
    });
}

export { posthog };