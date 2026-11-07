// เปลือก PWA — แคชเฉพาะไฟล์ของตัวเอง
// ตัวแอปจริงอยู่คนละโดเมน (script.google.com) จึงไม่แตะ ปล่อยให้ผ่านไปตามปกติ
const CACHE  = 'hwt-shell-v14';
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
  // ตัวหน้าเว็บต้องบังคับ revalidate ด้วย เพราะ GitHub Pages ตั้ง max-age=600
  // ถ้าปล่อยให้ fetch ใช้แคช HTTP ตามปกติ ผู้ใช้จะติดเวอร์ชันเก่าไปอีก 10 นาทีหลัง deploy
  const req = e.request.mode === 'navigate'
    ? new Request(e.request.url, { cache: 'no-cache', credentials: 'same-origin' })
    : e.request;

  e.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request).then(hit => hit || caches.match('./index.html')))
  );
});
