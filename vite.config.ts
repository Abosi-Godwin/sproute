import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        VitePWA({
            registerType: "autoUpdate",
            includeAssets: ["sproute.svg", "icons/*.png"],
            manifest: {
                name: "Sproute",
                short_name: "Sproute",
                description:
                    "AI-powered WhatsApp outreach for local businesses",
                theme_color: "#10b981",
                background_color: "#09090b",
                display: "standalone",
                orientation: "portrait",
                start_url: "/",
                icons: [
                    {
                        src: "/icons/android-chrome-192x192.png",
                        sizes: "192x192",
                        type: "image/png",
                        purpose: "any maskable"
                    },
                    {
                        src: "/icons/android-chrome-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "any maskable"
                    }
                ]
            },
            workbox: {
                globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: "CacheFirst",
                        options: {
                            cacheName: "google-fonts-cache",
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365
                            }
                        }
                    },
                    {
                        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                        handler: "CacheFirst",
                        options: {
                            cacheName: "gstatic-fonts-cache",
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365
                            }
                        }
                    }
                ]
            }
        })
    ],
    build: {
        rolldownOptions: {
            output: {
                codeSplitting: {
                    groups: [
                        {
                            name: "react",
                            test: /node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/,
                            priority: 40
                        },
                        {
                            name: "supabase",
                            test: /node_modules[\\/]@supabase[\\/]/,
                            priority: 30
                        },
                        {
                            name: "posthog",
                            test: /node_modules[\\/]posthog-js[\\/]/,
                            priority: 30
                        },
                        {
                            name: "motion",
                            test: /node_modules[\\/](framer-motion|motion|motion-dom|motion-utils)[\\/]/,
                            priority: 30
                        },
                        {
                            name: "query",
                            test: /node_modules[\\/]@tanstack[\\/]/,
                            priority: 20
                        },
                        {
                            name: "vendor",
                            test: /node_modules/,
                            priority: 10
                        }
                    ]
                }
            }
        }
    },
    server: {
        port: 3000,
        open: true,
        proxy: {
            "/api/serpapi": {
                target: "https://serpapi.com",
                changeOrigin: true,
                rewrite: path => path.replace(/^\/api\/serpapi/, "/search")
            }
        }
    },
    preview: {
        port: 3000
    }
});