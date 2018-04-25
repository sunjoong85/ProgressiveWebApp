
var CACHE_NAME = 'my-site-cache-v1.0.6';
//Cache 타겟

var urlsToCache = [
 '/',
 '/app/lib/jquery.js',
 '/app/lib/lodash.js',
 '/app/lib/bootstrap.min.css',
 '/app/lib/bootstrap.min.js',
 '/app/lib/app.css'
];
//url에 대해서 하나라도 캐쉬에 실패하면 에러
self.addEventListener('install', function(event) {
 // Perform install steps
 event.waitUntil(
     caches.open(CACHE_NAME)
     .then(function(cache) {
     //     console.log('Opened cache', cache);
         return cache.addAll(urlsToCache);
     }).catch(function(){
         console.log('install error')
     })
 );

});

self.addEventListener('fetch', function(event) {
//    console.log("fetch url " ,event.request);
 event.respondWith(
     caches.match(event.request)
     .then(function(response) {
             // Cache hit - return response
             if (response) { //cache found don't hit to server
                 return response;
             }
             return fetch(event.request);
         }
     ).catch(function(){
         console.log("fetch error");
     })
 );
});


self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            for(var i=0, len=cacheNames.length; i<len; i++) {
                if(cacheNames[i] !== CACHE_NAME) {  //현재 캐시 버전과 다른 경우 제거
                  caches.delete(cacheNames[i]);
                }
            }
        })
    );
});
