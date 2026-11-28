const CACHE_NAME = "evolift-v2";
const CACHE_PREFIX = "evolift-";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./styles/style.css",
  "./js/script.js",
  "./assets/logo-evolift-transparente.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// Instala o Service Worker e armazena os arquivos
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Ativa o Service Worker
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => self.clients.claim())
  );
});

// Intercepta as requisições
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith((async () => {
    let response;
    try {
      response = await fetch(event.request, { cache: "no-cache" });
    } catch (error) {
      const cachedResponse = await caches.match(event.request);
      if (cachedResponse) return cachedResponse;
      throw error;
    }

    if (response.ok) {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(event.request, response.clone());
      } catch (error) {
        console.error("Não foi possível atualizar o cache do Evolift.", error);
      }
    }
    return response;
  })());
});