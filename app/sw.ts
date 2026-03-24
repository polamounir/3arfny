import { defaultCache } from "@serwist/next/browser";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";

declare global {
  interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {}
}

const sw = self as unknown as ServiceWorkerGlobalScope;

sw.addEventListener("install", (event) => {
  sw.skipWaiting();
});

sw.addEventListener("activate", (event) => {
  event.waitUntil(sw.clients.claim());
});

// Basic Serwist initialization
// This will handle basic caching for the PWA
import { Serwist } from "serwist";

const serwist = new Serwist({
  precacheEntries: (self as any).__SW_MANIFEST,
  precacheOptions: {
    cleanupOutdatedCaches: true,
  },
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
