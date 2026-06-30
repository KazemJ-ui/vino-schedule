const CACHE = 'vino-v17';

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
  // Ничего не кэшируем — всё из сети
  if (e.request.url.includes('vinokhinkali.mooo.com')) {
    e.respondWith(fetch(e.request).catch(() => new Response('[]')));
    return;
  }
  e.respondWith(fetch(e.request, {cache: 'no-store'}).catch(() => caches.match(e.request)));
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
