import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";

declare global {
  interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
    addEventListener: any;
    skipWaiting: any;
    clients: any;
    registration: any;
  }
}

const sw = self as unknown as ServiceWorkerGlobalScope;

sw.addEventListener("install", (event: any) => {
  sw.skipWaiting();
});

sw.addEventListener("activate", (event: any) => {
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

sw.addEventListener('push', (event: any) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    (self as any).registration.showNotification(data.title || 'عرفني', {
      body: data.body || 'وصلتك رسالة جديدة!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      dir: 'rtl',
      lang: 'ar',
      data: { url: data.url || '/dashboard' }
    })
  );
});

sw.addEventListener('notificationclick', (event: any) => {
  event.notification.close();
  event.waitUntil(
    (self as any).clients.openWindow(event.notification.data?.url || '/dashboard')
  );
});
