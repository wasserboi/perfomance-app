// Externe Übungsdatenbank (RepDB, repdb.co) – Illustrationen + Anleitung auf Deutsch.
// Kostenlose Nutzung in Apps, Bedingung ist eine sichtbare Quellenangabe (siehe Settings-Sheet).
import {kvGet,kvSet} from './store.js';

const BASE='https://exercise-dataset.com/';
const KEY='repdb.cache';
const MAXAGE=14*864e5; // 14 Tage, dann im Hintergrund neu laden
let cache=null;

export async function loadDB(){
  if(cache)return cache;
  try{const c=await kvGet(KEY);if(c&&c.exercises){cache=c.exercises;if(Date.now()-(c.at||0)<MAXAGE)return cache;refreshInBackground();return cache}}catch(e){}
  try{const r=await fetch(BASE+'exercises.json');if(!r.ok)throw 0;const j=await r.json();cache=j.exercises;kvSet(KEY,{exercises:j.exercises,at:Date.now()}).catch(()=>{});return cache}
  catch(e){cache=[];return cache}
}
async function refreshInBackground(){try{const r=await fetch(BASE+'exercises.json');if(!r.ok)return;const j=await r.json();cache=j.exercises;kvSet(KEY,{exercises:j.exercises,at:Date.now()})}catch(e){}}

export const imgUrl=path=>path?BASE+path:null;

function norm(s){return (s||'').toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').replace(/[()]/g,'')}
export async function search(term){
  const db=await loadDB();const t=norm(term);if(t.length<2)return[];
  const words=t.split(/\s+/).filter(Boolean);
  const scored=db.map(ex=>{const name=norm(ex.name_de)+' '+norm(ex.name_en);let s=0;
    for(const w of words){if(new RegExp('(^|[^a-z])'+w).test(name))s+=name.startsWith(w)?4:2;else if(name.includes(w))s+=1;else return[0,ex]}
    return[s,ex]});
  return scored.filter(x=>x[0]>0).sort((a,b)=>b[0]-a[0]).slice(0,20).map(x=>x[1]);
}
// Versucht, einen eigenen Übungsnamen automatisch zuzuordnen (z. B. "Bench Press (Barbell)" -> Ex-Eintrag)
export async function autoMatch(name){
  const db=await loadDB();const n=norm(name);
  let best=null,bestScore=0;
  db.forEach(ex=>{const en=norm(ex.name_en),de=norm(ex.name_de);
    let s=0;if(n===en||n===de)s=100;else if(n.includes(en)||en.includes(n))s=Math.min(en.length,n.length);
    if(s>bestScore){bestScore=s;best=ex}});
  return bestScore>=4?best:null;
}
