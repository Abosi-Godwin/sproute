type Properties = Record<string, unknown>;

type Queued =
    | { method: "capture"; event: string; properties?: Properties; at: Date }
    | { method: "identify"; id: string; properties?: Properties }
    | { method: "reset" };

const MAX_QUEUE = 200;

let client: any = null;
let started = false;
let queue: Queued[] = [];

const push = (item: Queued) => {
    if (queue.length >= MAX_QUEUE) queue.shift();
    queue.push(item);
};

const flush = () => {
    if (!client) return;

    const pending = queue;
    queue = [];

    for (const item of pending) {
        if (item.method === "capture") {
            client.capture(item.event, item.properties, { timestamp: item.at });
        } else if (item.method === "identify") {
            client.identify(item.id, item.properties);
        } else {
            client.reset();
        }
    }
};

export const posthog = {
    capture(event: string, properties?: Properties) {
        if (client) client.capture(event, properties);
        else push({ method: "capture", event, properties, at: new Date() });
    },
    identify(id: string, properties?: Properties) {
        if (client) client.identify(id, properties);
        else push({ method: "identify", id, properties });
    },
    reset() {
        if (client) client.reset();
        else push({ method: "reset" });
    }
};

export function initPostHog() {
    const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
    if (!key || started) return;
    started = true;

    const start = () => {
        import("posthog-js")
            .then(({ default: ph }) => {
                ph.init(key, {
                    api_host:
                        import.meta.env.VITE_POSTHOG_HOST ||
                        "https://us.i.posthog.com",
                    capture_pageview: false,
                    capture_pageleave: true,
                    capture_exceptions: true,
                    session_recording: {
                        maskAllInputs: true
                    }
                });
                client = ph;
                flush();
            })
            .catch(() => {});
    };

    if ("requestIdleCallback" in window) {
        window.requestIdleCallback(start, { timeout: 2500 });
    } else {
        setTimeout(start, 1500);
    }
}