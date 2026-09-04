import {S,save,today,uid,fmtD,fmtDL,emit} from './state.js';
import {sheet,closeSheet,toast,el,confirm2,$} from './ui.js';
import {photoAll,photoPut,photoDel,photoGet} from './store.js';

export let PH=[];// {id,d,synced,has,remoteSha}
const all=()=>photoAll();
const put=p=>photoPut(p);
const del=id=>photoDel(id);
const get=id=>photoGet(id);
export async function loadMeta(){const local=await all();const map={};PH.forEach(p=>map[p.id]=p);local.forEach(p=>{map[p.id]=Object.assign(map[p.id]||{},{id:p.id,d:p.d,synced:p.synced,has:!!p.data})});PH=Object.values(map).sort((a,b)=>a.d<b.d?-1:1)}
function compress(file){return new Promise((ok,err)=>{const img=new Image();const u=URL.createObjectURL(file);img.onload=()=>{const m=1000,k=Math.min(1,m/Math.max(img.width,img.height)),cv=document.createElement('canvas');cv.width=Math.round(img.width*k);cv.height=Math.round(img.height*k);cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height);URL.revokeObjectURL(u);ok(cv.toDataURL('image/jpeg',.82).split(',')[1])};img.onerror=err;img.src=u})}
export async function add(file){if(!file)return;toast('Foto wird gespeichert…');const data=await compress(file);const id=today()+'_'+uid();await put({id,d:today(),data,synced:false});await loadMeta();toast('Foto gespeichert');save();emit('photos')}
async function ensure(id){let rec=await get(id);if(rec&&rec.data)return rec;const p=PH.find(x=>x.id===id);if(!p||!p.remoteSha)return null;const {gh}=await import('./sync.js');const b=await gh('/git/blobs/'+p.remoteSha);rec={id,d:p.d,data:b.content.replace(/\n/g,''),synced:true};await put(rec);p.has=true;return rec}
export async function pushBlobs(t,pendingSynced){const entries=[];for(const p of PH){if(p.synced)continue;const rec=await get(p.id);if(!rec||!rec.data)continue;const {gh}=await import('./sync.js');const b=await gh('/git/blobs',{method:'POST',body:JSON.stringify({content:rec.data,encoding:'base64'})});entries.push({path:'photos/'+p.id+'.jpg',mode:'100644',type:'blob',sha:b.sha});p.remoteSha=b.sha;rec.synced=true;await put(rec);if(pendingSynced)pendingSynced.push(p)}
  (S.photosDeleted||[]).forEach(id=>{if(t&&t.files['photos/'+id+'.jpg'])entries.push({path:'photos/'+id+'.jpg',mode:'100644',type:'blob',sha:null})});return entries}
export function mergeRemote(files){const d=new Set(S.photosDeleted||[]);Object.keys(files).filter(k=>k.startsWith('photos/')).forEach(k=>{const id=k.slice(7,-4);if(d.has(id))return;let p=PH.find(x=>x.id===id);if(!p){p={id,d:id.slice(0,10),synced:true,has:false};PH.push(p)}p.remoteSha=files[k];p.synced=true});PH.sort((a,b)=>a.d<b.d?-1:1);emit('photos')}

const img=rec=>`<img src="data:image/jpeg;base64,${rec.data}">`;
export async function renderGrid(){const g=el('pgrid');if(!g)return;const list=[...PH].reverse().slice(0,7);
  const cells=await Promise.all(list.map(async p=>{const rec=await get(p.id);return `<button data-a="pview" data-id="${p.id}">${rec&&rec.data?img(rec):'<div class="more">☁︎</div>'}<span>${fmtD(p.d)}</span></button>`}));
  g.innerHTML=cells.join('')+(PH.length>7?`<button class="more" data-a="pall">+${PH.length-7}</button>`:'')||'<div class="tiny" style="grid-column:1/-1">Noch keine Fotos.</div>'}
export async function view(id,cmp){const rec=await ensure(id);if(!rec){toast('Foto nicht verfügbar (offline?)');return}
  const idx=PH.findIndex(x=>x.id===id),prev=PH[idx-1],next=PH[idx+1];const cmpRec=cmp?await ensure(cmp):null;
  sheet(`<h3>${fmtDL(rec.d+'T12:00')}${cmpRec?` <span class="tiny">vs. ${fmtD(cmpRec.d)}</span>`:''}</h3>
    ${cmpRec?`<div class="pcmp pview">${img(cmpRec)}${img(rec)}</div>`:`<div class="pview">${img(rec)}</div>`}
    <div class="grid3 mt3"><button class="btn sm" data-x="prev" ${prev?'':'disabled'}>‹ Älter</button><button class="btn sm" data-x="cmp">${cmpRec?'Einzeln':'Vergleichen'}</button><button class="btn sm" data-x="next" ${next?'':'disabled'}>Neuer ›</button></div>
    ${cmpRec?'':'<div class="tiny mt2">Vergleichen zeigt das älteste Foto links neben diesem.</div>'}
    <button class="btn ghost danger wide mt2" data-x="del">Foto löschen</button><button class="btn wide mt2" data-x="close">Schließen</button>`,{
    close:closeSheet,prev:()=>prev&&view(prev.id,cmp&&prev.id!==cmp?cmp:null),next:()=>next&&view(next.id,cmp&&next.id!==cmp?cmp:null),
    cmp:()=>view(id,cmp?null:(PH[0].id!==id?PH[0].id:(prev?prev.id:null))),
    del:async()=>{if(!confirm2('Foto löschen?'))return;await del(id);PH=PH.filter(x=>x.id!==id);S.photosDeleted=(S.photosDeleted||[]).concat(id);save();closeSheet();emit('photos')}});
}
export async function viewAll(){sheet(`<h3>Alle Fotos (${PH.length})</h3><div class="pgrid wide" id="pall">${[...PH].reverse().map(p=>`<button data-x="open" data-id="${p.id}"><div class="more">…</div><span>${fmtD(p.d)}</span></button>`).join('')}</div><button class="btn wide mt3" data-x="close">Schließen</button>`,{close:closeSheet,open:b=>view(b.dataset.id)});
  for(const p of [...PH].reverse()){const rec=await get(p.id);const e=$(`#pall [data-id="${p.id}"]`);if(rec&&rec.data&&e)e.innerHTML=img(rec)+`<span>${fmtD(p.d)}</span>`}}
