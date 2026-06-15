const CACHE = 'vino-v15';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
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

  // Перенаправляем index.html на app.html
  if (e.request.url.endsWith('/vino-schedule/') || 
      e.request.url.endsWith('/vino-schedule') ||
      e.request.url.includes('index.html')) {
    e.respondWith(
      fetch(e.request.url.replace('index.html', 'app.html').replace(/\/vino-schedule\/?$/, '/vino-schedule/app.html'), {cache: 'no-store'})
    );
    return;
  }

  // Всё остальное — из сети без кэша
  e.respondWith(
    fetch(e.request, {cache: 'no-store'}).catch(() => new Response(''))
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
  e.waitUntil(clients.openWindow('./app.html'));
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
