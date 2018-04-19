
var CACHE_NAME = 'my-site-cache-v1.0.1';
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


//TODO ServiceWorker Update 부분이 애매하다.
self.addEventListener('activate', function(event){
 /*ㅊ
 var cacheWhitelist = ['pages-cache-v1', 'blog-posts-cache-v1'];

 event.waitUntil(
     caches.keys().then(function(cacheNames) {
         return Promise.all(
             cacheNames.map(function(cacheName) {
                 if (cacheWhitelist.indexOf(cacheName) === -1) {
                     return caches.delete(cacheName);
                 }
             })
         );
     })
 );*/

 console.log("activate");
});
