// Menyimpan tampilan aplikasi agar cepat dibuka. Data tetap diambil dari Supabase.
const V = 'runup-v4';
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.hostname.endsWith('supabase.co')) return;
  e.respondWith(caches.open(V).then(c => fetch(r).then(res => { if (res.ok || res.type === 'opaque') c.put(r, res.clone()); return res; })
    .catch(() => c.match(r))));
});
