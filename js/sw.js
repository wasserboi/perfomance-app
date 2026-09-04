const C='perf-v13';
const FILES=['./','./index.html','./manifest.json','./css/app.css','./js/app.js','./js/state.js','./js/ui.js','./js/sync.js','./js/photos.js','./js/charts.js','./js/timer.js','./js/food.js','./js/basics.js','./js/views/training.js','./js/views/plans.js','./js/views/progress.js','./js/views/body.js','./js/views/macros.js','./icon-180.png','./icon-512.png','./zxing.min.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(FILES)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{
  if(new URL(e.request.url).origin!==location.origin)return;
  e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));return r}).catch(()=>caches.match(e.request)));
});
