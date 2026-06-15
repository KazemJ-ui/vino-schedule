const CACHE = 'vino-v14';
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
      Promise.all(keys.map(k => caches.delete(k))) // Удаляем ВСЕ кэши
    ).then(() => {
      // Принудительно перезагружаем все вкладки
      return self.clients.matchAll({type:'window'}).then(clients => {
        clients.forEach(client => client.navigate(client.url));
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

  // API — всегда сеть
  if (e.request.url.includes('vinokhinkali.mooo.com')) {
    e.respondWith(fetch(e.request).catch(() => new Response('[]')));
    return;
  }

  // index.html — НИКОГДА не кэшируем
  if (e.request.url.includes('vino-schedule') && !e.request.url.match(/\.[a-z]{2,4}(\?.*)?$/)) {
    e.respondWith(fetch(e.request, {cache: 'no-store'}));
    return;
  }
  if (e.request.url.endsWith('/') || e.request.url.includes('index.html')) {
    e.respondWith(fetch(e.request, {cache: 'no-store'}));
    return;
  }

  // Остальное — сеть, без кэша
  e.respondWith(fetch(e.request, {cache: 'no-store'}).catch(() => new Response('')));
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

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
