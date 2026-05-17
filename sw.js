const CACHE = 'vino-v10';

// НЕ кэшируем index.html — он всегда берётся из сети
const STATIC_FILES = [
  './icon.png',
  './manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(STATIC_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => {
      // Удаляем index.html из кэша при любом обновлении
      return caches.open(CACHE).then(cache => {
        cache.delete('./');
        cache.delete('./index.html');
        cache.delete('/vino-schedule/');
        cache.delete('/vino-schedule/index.html');
      });
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') {
    e.respondWith(fetch(e.request));
    return;
  }

  // API — всегда сеть, никогда не кэшируем
  if (e.request.url.includes('vinokhinkali.mooo.com')) {
    e.respondWith(fetch(e.request).catch(() => new Response('[]')));
    return;
  }

  // index.html — ВСЕГДА из сети, никогда из кэша
  if (e.request.url.endsWith('/') || 
      e.request.url.includes('index.html') || 
      e.request.url.includes('vino-schedule/') && !e.request.url.includes('.')) {
    e.respondWith(
      fetch(e.request, {cache: 'no-store'})
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Остальное (иконки, шрифты) — кэш
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
