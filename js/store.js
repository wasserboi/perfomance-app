// Zentrale Speicherschicht: IndexedDB als Hauptspeicher, localStorage als Notfallkopie.
const DB='perf',VER=2;
let dbp=null;
export function idb(){
  if(dbp)return dbp;
  dbp=new Promise((ok,err)=>{
    const r=indexedDB.open(DB,VER);
    r.onupgradeneeded=e=>{const db=r.result;
      if(!db.objectStoreNames.contains('photos'))db.createObjectStore('photos',{keyPath:'id'});
      if(!db.objectStoreNames.contains('kv'))db.createObjectStore('kv');};
    r.onsuccess=()=>ok(r.result);r.onerror=()=>err(r.error);
  }).catch(e=>{dbp=null;throw e});
  return dbp;
}
const tx=(store,mode,fn)=>idb().then(db=>new Promise((ok,err)=>{const q=fn(db.transaction(store,mode).objectStore(store));q.onsuccess=()=>ok(q.result);q.onerror=()=>err(q.error)}));
export const kvGet=k=>tx('kv','readonly',s=>s.get(k));
export const kvSet=(k,v)=>tx('kv','readwrite',s=>s.put(v,k));
export const kvDel=k=>tx('kv','readwrite',s=>s.delete(k));
export const photoAll=()=>tx('photos','readonly',s=>s.getAll()).catch(()=>[]);
export const photoPut=p=>tx('photos','readwrite',s=>s.put(p));
export const photoDel=id=>tx('photos','readwrite',s=>s.delete(id));
export const photoGet=id=>tx('photos','readonly',s=>s.get(id)).catch(()=>null);

// Spiegel in localStorage, solange es passt (Notfall, falls IndexedDB streikt)
export function mirror(key,str){try{localStorage.setItem(key,str);return true}catch(e){try{localStorage.removeItem(key)}catch(_){}return false}}
export function readMirror(key){try{return localStorage.getItem(key)}catch(e){return null}}
