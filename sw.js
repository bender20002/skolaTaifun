/* СтройСтатус 3D — Service Worker
   index.html: network-first (доставка обновлений). Остальное: cache-first.
   Данные/файлы Яндекс.Диска: всегда сеть (не кэшируются). */
var VERSION = '2026.07.16';
var C = 'shkola-' + VERSION;
var CORE = [
  './', './index.html', './manifest.webmanifest', './config.js',
  './icon-192.png', './icon-512.png', './icon-180.png', './favicon.png',
  './vendor/xlsx.full.min.js',
  './vendor/three/build/three.min.js',
  './vendor/three/examples/js/controls/OrbitControls.js',
  './vendor/three/examples/js/loaders/GLTFLoader.js',
  './vendor/three/examples/js/loaders/DRACOLoader.js'
];
self.addEventListener('install', function(e){
  // модель не пред-кэшируем (22 МБ) — она закэшируется при первом обращении
  e.waitUntil(caches.open(C).then(function(c){
    return Promise.all(CORE.map(function(u){ return c.add(u).catch(function(){}); }));
  }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.map(function(k){ if(k !== C) return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('message', function(e){
  if(e.data === 'skipWaiting') self.skipWaiting();
});
function isIndex(url){
  return url.pathname.endsWith('/') || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/config.js');
}
self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if(url.hostname.indexOf('yandex') >= 0) return;             // данные/файлы — мимо кэша
  if(isIndex(url)){
    // NETWORK FIRST: свежий index, при офлайне — из кэша
    e.respondWith(
      fetch(e.request).then(function(resp){
        var cp = resp.clone(); caches.open(C).then(function(c){ c.put(e.request, cp); }).catch(function(){});
        return resp;
      }).catch(function(){ return caches.match(e.request).then(function(r){ return r || caches.match('./index.html'); }); })
    );
    return;
  }
  // CACHE FIRST: библиотеки/иконки/модель
  e.respondWith(
    caches.match(e.request).then(function(r){
      if(r) return r;
      return fetch(e.request).then(function(resp){
        var cp = resp.clone(); caches.open(C).then(function(c){ c.put(e.request, cp); }).catch(function(){});
        return resp;
      }).catch(function(){ return caches.match('./index.html'); });
    })
  );
});
