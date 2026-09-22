const CACHE_NAME = "A.H.M.A-v1";
const API_CACHE_NAME = "A.H.M.A-supabase-v1";

const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./hub.html",
  "./plantopedia.html",
  "./sensores.html",
  "./manifest.json",

  "./src/services/plant-service.js",

  "./assets/css/base/reset.css",
  "./assets/css/base/typography.css",
  "./assets/css/base/variables.css",

  "./assets/css/components/content-boxes.css",
  "./assets/css/components/footer.css",
  "./assets/css/components/header.css",
  "./assets/css/components/nav-hamburger.css",

  "./assets/css/pages/login.css",
  "./assets/css/pages/plantopedia.css",
  "./assets/css/pages/sensores.css",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        ASSETS_TO_CACHE.map((url) =>
          cache
            .add(url)
            .catch((err) => console.warn("[PWA] Falhou ao cachear:", url, err))
        )
      );
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            // Remove caches de versões antigas do app ou da API
            if (cache !== CACHE_NAME && cache !== API_CACHE_NAME) {
              console.log("[PWA] Removendo cache antigo:", cache);
              return caches.delete(cache);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // ⚠️ IMPORTANTE: O Cache Storage só aceita requisições GET.
  // Ignora métodos como POST, PUT, DELETE, PATCH, etc.
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);

  // 1. ESTRATÉGIA PARA O SUPABASE (Network First -> Fallback para Cache)
  if (url.origin.includes("supabase.co")) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(API_CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          console.warn("[PWA] Offline/Erro de Rede no Supabase. Buscando do cache...");
          return caches.match(event.request);
        })
    );
    return;
  }

  // 2. ESTRATÉGIA PARA ARQUIVOS ESTÁTICOS DO SITE (Stale-While-Revalidate)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});