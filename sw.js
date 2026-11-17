
const CACHE = "minha-escala-v2";

const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// Instalação e cache para funcionamento offline
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Ativação e limpeza dos caches antigos
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Funcionamento offline
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached ||
        fetch(event.request)
          .then(response => {
            const copy = response.clone();
            caches.open(CACHE).then(cache => {
              cache.put(event.request, copy);
            });
            return response;
          })
          .catch(() => caches.match("./index.html"));
    })
  );
});

// Recebimento de notificações Push
self.addEventListener("push", event => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch (error) {
    data = {
      body: event.data ? event.data.text() : ""
    };
  }

  const title = data.title || "Minha Escala";

  const options = {
    body: data.body || "Você tem um aviso sobre sua escala.",
    icon: "./icons/icon-192.png",
    badge: "./icons/icon-192.png",
    tag: data.tag || "minha-escala",
    renotify: false,
    data: {
      url: data.url || self.registration.scope
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Ação ao tocar na notificação
self.addEventListener("notificationclick", event => {
  event.notification.close();

  const targetUrl =
    event.notification.data?.url || self.registration.scope;

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then(windowClients => {
      for (const client of windowClients) {
        if ("focus" in client) {
          return client.focus();
        }
      }

      return clients.openWindow(targetUrl);
    })
  );
});
