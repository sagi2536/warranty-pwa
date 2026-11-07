// เปลือก PWA — แคชเฉพาะไฟล์ของตัวเอง
// ตัวแอปจริงอยู่คนละโดเมน (script.google.com) จึงไม่แตะ ปล่อยให้ผ่านไปตามปกติ
const CACHE  = 'hwt-shell-v3';
const ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './icon-maskable.png',
  './apple-touch-icon.png', './favicon-32.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;

  // ขอจากเน็ตก่อนเพื่อให้ได้เวอร์ชันใหม่เสมอ ถ้าเน็ตล่มค่อยใช้ของที่แคชไว้
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request).then(hit => hit || caches.match('./index.html')))
  );
});
