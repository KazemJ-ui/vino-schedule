const CACHE = 'vino-v3';
const FILES = [
  './',
  './index.html',
  './icon.png',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Nunito:wght@400;600;700;800&display=swap'
];

// Установка — кэшируем все файлы
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(FILES))
  );
  self.skipWaiting();
});

// Активация — удаляем старые кэши
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Запросы — только GET кэшируем, все остальные через сеть
self.addEventListener('fetch', e => {
  // Только GET запросы кэшируем
  if (e.request.method !== 'GET') {
    e.respondWith(fetch(e.request));
    return;
  }

  // API запросы всегда через сеть
  if (e.request.url.includes('vinokhinkali.mooo.com') || e.request.url.includes('supabase.co')) {
    e.respondWith(fetch(e.request).catch(() => new Response('[]')));
    return;
  }

  // Остальное: сначала кэш, потом сеть
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
