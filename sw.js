// Guarda una copia de la app en el celular la primera vez que se abre,
// para que siga funcionando aunque se corte el wifi de la feria.
// Si cambia algún archivo, la copia se actualiza sola en la visita siguiente.
const CACHE = 'genomalab-v14';
const ARCHIVOS = [
  './',
  'index.html',
  'cartel.html',
  'laboratorio.html',
  'css/historia.css',
  'js/historia.js',
  'manifest.webmanifest',
  'css/estilos.css',
  'js/datos-modelos.js',
  'js/datos-mapa.js',
  'js/genetica.js',
  'js/helice.js',
  'js/visor-3d.js',
  'js/app.js',
  'img/qr-sitio.svg',
  'img/icono.svg',
  'img/icono-192.png',
  'img/icono-512.png',
  'img/fotos/ansar.webp',
  'img/fotos/guepardo-rey.webp',
  'img/fotos/guepardo.webp',
  'img/fotos/jaguar-negro.webp',
  'img/fotos/jaguar.webp',
  'img/fotos/leopardo-negro.webp',
  'img/fotos/leopardo.webp',
  'img/fotos/llama.webp',
  'img/fotos/mamut.webp',
  'img/fotos/ojo-celeste.webp',
  'img/fotos/ojo-marron.webp',
  'img/fotos/pez-hielo.webp',
  'img/fotos/siames.webp',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(cache => cache.addAll(ARCHIVOS))
      .then(() => self.skipWaiting()),
  );
});

// Borra las copias de versiones anteriores.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

// Responde al instante con la copia guardada y, de fondo, la renueva desde internet si hay.
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;
  event.respondWith(
    caches.open(CACHE).then(async cache => {
      const saved = await cache.match(request, { ignoreSearch: true });
      const fresh = fetch(request)
        .then(response => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => saved || Response.error());
      if (saved) {
        event.waitUntil(fresh);
        return saved;
      }
      return fresh;
    }),
  );
});
