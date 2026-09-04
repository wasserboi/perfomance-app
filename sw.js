const C='perf-v23';
const FILES=['./','./index.html','./manifest.json','./css/app.css','./js/app.js','./js/state.js','./js/ui.js','./js/sync.js','./js/photos.js','./js/charts.js','./js/timer.js','./js/food.js','./js/basics.js','./js/views/today.js','./js/views/training.js','./js/views/plans.js','./js/views/progress.js','./js/views/body.js','./js/views/macros.js','./icon-180.png','./icon-512.png','./zxing.min.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(FILES)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))));self.clients.claim()});
// Eigene Dateien: immer beim Server nachfragen (ETag), offline aus dem Cache. Fremde APIs unberührt.
self.addEventListener('fetch',e=>{
  if(new URL(e.request.url).origin!==location.origin)return;
  e.respondWith(fetch(e.request,{cache:'no-cache'}).then(r=>{if(r.ok){const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp))}return r}).catch(()=>caches.match(e.request,{ignoreSearch:true})));
});
