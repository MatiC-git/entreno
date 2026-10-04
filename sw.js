// Service worker: guarda los archivos de la app para que funcione sin conexión.
// Estrategia "primero la red": si hay internet trae la última versión (y actualiza la copia guardada);
// si no hay, usa la copia guardada. Así los cambios nuevos aparecen apenas se recarga.

const CACHE = "entreno-v2";
const FILES = [
  "./",
  "index.html",
  "css/styles.css",
  "js/app.js",
  "manifest.json",
  "data/exercises-es.json",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/apple-touch-icon.png",
];

// Al instalarse, guarda todos los archivos de una vez
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)));
  self.skipWaiting();
});

// Borra las copias de versiones viejas (si algún día cambia el nombre de CACHE)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request, { ignoreSearch: true }))
  );
});
