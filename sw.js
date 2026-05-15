const CACHE = 'vino-v5';
const FILES = [
  './icon.png',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Nunito:wght@400;600;700;800&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') {
    e.respondWith(fetch(e.request));
    return;
  }

  // API — всегда сеть
  if (e.request.url.includes('vinokhinkali.mooo.com')) {
    e.respondWith(fetch(e.request).catch(() => new Response('[]')));
    return;
  }

  // index.html — Network First: всегда свежая версия из сети
  if (e.request.url.endsWith('/') || e.request.url.includes('index.html')) {
    e.respondWith(
      fetch(e.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
          return response;
        })
        .catch(() => caches.match(e.request)) // оффлайн — из кэша
    );
    return;
  }

  // Остальное (иконки, шрифты) — Cache First
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => cached);
    })
  );
});

// Push уведомления
self.addEventListener('push', e => {
  let data = {title: 'Вино & Хинкали', body: 'Новое уведомление'};
  try { data = JSON.parse(e.data.text()); } catch(err){}
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: './icon.png',
      badge: './icon.png'
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('./'));
});
