// Menyimpan tampilan aplikasi agar cepat dibuka. Data tetap diambil dari Supabase.
const V = 'runup-v10', STATUS = 'runup-status';
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== STATUS).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.hostname.endsWith('supabase.co') || u.hostname.endsWith('strava.com')) return;
  e.respondWith(caches.open(V).then(c => fetch(r).then(res => { if (res.ok || res.type === 'opaque') c.put(r, res.clone()); return res; })
    .catch(() => c.match(r))));
});

// Pengingat jam 20:00 saat aplikasi tertutup (kalau HP mengizinkan sinkron berkala)
self.addEventListener('periodicsync', e => { if (e.tag === 'pengingat') e.waitUntil(cekIngat()); });
async function cekIngat() {
  const c = await caches.open(STATUS), r = await c.match('status');
  if (!r) return;
  const s = await r.json(), d = new Date();
  const tg = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  if (!s.aktif || d.getHours() < 20) return;
  const n = await c.match('notif');
  if (n && (await n.text()) === tg) return;
  const hariIni = s.tanggal === tg;
  if (hariIni && (!s.belum || !s.belum.length)) return;
  await c.put('notif', new Response(tg));
  await self.registration.showNotification('RunUp: latihan hari ini belum dicatat', {
    body: hariIni ? 'Belum tercatat: ' + s.belum.join(', ') + '. Buka RunUp untuk mencatat atau sinkron Strava.'
                  : 'Jangan lupa catat latihan hari ini. Buka RunUp untuk mencatat atau sinkron Strava.',
    icon: 'icon-192.png', badge: 'icon-192.png', tag: 'runup-20' });
}
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(ws => {
    for (const w of ws) if ('focus' in w) return w.focus();
    return clients.openWindow('./');
  }));
});
