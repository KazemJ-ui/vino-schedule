const CACHE = 'vino-v13';
const FILES = [
  './icon.png',
  './manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
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

  // index.html — НИКОГДА не кэшируем, всегда из сети
  if (e.request.url.includes('vino-schedule') && !e.request.url.match(/\.[a-z]{2,4}$/)) {
    e.respondWith(fetch(e.request, {cache: 'no-store'}));
    return;
  }
  if (e.request.url.endsWith('/') || e.request.url.includes('index.html')) {
    e.respondWith(fetch(e.request, {cache: 'no-store'}));
    return;
  }

  // Шрифты и иконки — кэш
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      });
    })
  );
});

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

// Принудительная активация по команде из страницы
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
