import { allRouteSegments } from "@/lib/routes";

// The service worker, served at /sw.js (registered in production only — see lib/pwa.ts). It's a
// route rather than a file in public/ so the list of pages to keep offline comes from
// lib/routes.ts and can never drift from the real URLs.
//
// Strategy:
//  - app pages (and only those): network first, cached copy when offline — every page is the
//    same client app, so any visited-or-precached page boots fully offline;
//  - /_next/static/* and /icons/*: cache first (content-hashed per build, never changes);
//  - everything else (/api/*, /admin, Google sign-in…): untouched, always the network.

export const dynamic = "force-static";

// Fixed at build time → each deploy ships a new worker, which drops the previous caches.
const VERSION = new Date().toISOString();
const PAGES = allRouteSegments().map((segments) => "/" + segments.map(encodeURIComponent).join("/"));

const source = `
const VERSION = ${JSON.stringify(VERSION)};
const PAGES = ${JSON.stringify(PAGES)};
const PAGE_CACHE = "cami-pages-" + VERSION;
const ASSET_CACHE = "cami-assets-" + VERSION;
const NETWORK_TIMEOUT_MS = 5000;

const isAsset = (url) => url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/");

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const pages = await caches.open(PAGE_CACHE);
    await pages.addAll([...PAGES, "/manifest.webmanifest"]);
    // The JS/CSS every page needs (they all share it): enough for the app to boot offline.
    const html = await (await pages.match("/")).text();
    const assets = [...new Set(Array.from(html.matchAll(/\\/_next\\/static\\/[^"'\\s)\\\\]+/g), (m) => m[0]))];
    const cache = await caches.open(ASSET_CACHE);
    await Promise.allSettled([...assets, "/icons/icon-192.png", "/icons/icon-512.png"].map((u) => cache.add(u)));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith("cami-") && key !== PAGE_CACHE && key !== ASSET_CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

// Assets the page loaded before this worker existed (lazy app chunk, fonts…), sent by the page.
self.addEventListener("message", (event) => {
  if (event.data?.type !== "CACHE_URLS") return;
  const urls = (event.data.urls || []).filter((u) => {
    try { const url = new URL(u); return url.origin === self.location.origin && isAsset(url); } catch { return false; }
  });
  event.waitUntil(caches.open(ASSET_CACHE).then((cache) => Promise.allSettled(urls.map((u) => cache.add(u)))));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    if (PAGES.includes(url.pathname)) event.respondWith(networkFirst(request, url.pathname));
    return;
  }
  if (isAsset(url)) event.respondWith(cacheFirst(request));
});

async function networkFirst(request, path) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), NETWORK_TIMEOUT_MS)),
    ]);
    if (response.ok) cache.put(path, response.clone());
    return response;
  } catch {
    return (await cache.match(path)) || (await cache.match("/")) || Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(ASSET_CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}
`;

export function GET() {
  return new Response(source, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      // Always revalidated: a new deploy must be picked up on the next visit.
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
