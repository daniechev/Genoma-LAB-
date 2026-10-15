// Guarda una copia de la app en el celular la primera vez que se abre,
// para que siga funcionando aunque se corte el wifi de la feria.
// Si cambia algún archivo, la copia se actualiza sola en la visita siguiente.
const CACHE = 'genomalab-v2';
const ARCHIVOS = [
  './',
  'index.html',
  'cartel.html',
  'presentacion.html',
  'manifest.webmanifest',
  'css/estilos.css',
  'css/presentacion.css',
  'js/datos-modelos.js',
  'js/datos-mapa.js',
  'js/datos-especies.js',
  'js/genetica.js',
  'js/evolucion.js',
  'js/nombre.js',
  'js/duelo.js',
  'js/stl.js',
  'js/sonido.js',
  'js/helice.js',
  'js/visor-3d.js',
  'js/app.js',
  'js/viaje.js',
  'js/fabrica.js',
  'js/sangre.js',
  'js/melodia.js',
  'js/mapa-calor.js',
  'js/experimento-evolucion.js',
  'js/velcro.js',
  'js/tu-nombre.js',
  'js/duelo-juego.js',
  'js/presentacion.js',
  'img/qr-sitio.svg',
  'img/icono.svg',
  'img/icono-192.png',
  'img/icono-512.png',
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
