import {S,replaceState,save,on} from './state.js';
import {el,toast} from './ui.js';
import * as photos from './photos.js';

const SKEY='perf.sync';
export let SY=JSON.parse(localStorage.getItem(SKEY)||'{"token":"","repo":"wasserboi/perf-data","last":0,"state":"off","pending":false,"shas":{}}');SY.shas=SY.shas||{};
export function saveSY(){localStorage.setItem(SKEY,JSON.stringify(SY))}
const API=()=>`https://api.github.com/repos/${SY.repo}`;
const H=()=>({Authorization:'Bearer '+SY.token,Accept:'application/vnd.github+json','Content-Type':'application/json'});
export const b64e=str=>btoa(unescape(encodeURIComponent(str)));
export const b64d=b=>decodeURIComponent(escape(atob(b.replace(/\n/g,''))));
export async function gh(path,opt={}){const r=await fetch(API()+path,{headers:H(),cache:'no-store',...opt});if(r.status===404)return null;if(!r.ok)throw new Error('GitHub '+r.status);return r.json()}
const HIST_DAYS=90;
function splitData(){const cut=new Date(Date.now()-HIST_DAYS*864e5).toISOString();const hist=S.workouts.filter(w=>w.date<cut),rest=Object.assign({},S,{workouts:S.workouts.filter(w=>w.date>=cut),histCount:hist.length});return{data:JSON.stringify(rest),history:JSON.stringify(hist)}}
async function hash(str){const b=await crypto.subtle.digest('SHA-1',new TextEncoder().encode(str));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
let syncT=null;
export function scheduleSync(){if(!SY.token)return;SY.pending=true;saveSY();clearTimeout(syncT);syncT=setTimeout(pushSync,3000);setStatus('Änderungen werden gesichert…')}
async function tree(){const ref=await gh('/git/ref/heads/main');if(!ref)return null;const c=await gh('/git/commits/'+ref.object.sha);const t=await gh('/git/trees/'+c.tree.sha);const files={};t.tree.forEach(e=>{if(e.type==='blob')files[e.path]=e.sha});return{commit:ref.object.sha,tree:c.tree.sha,files}}
export async function blob(sha){const b=await gh('/git/blobs/'+sha);return b64d(b.content)}
async function getAll(){const t=await tree();if(!t||!t.files['data.json'])return null;
  const data=JSON.parse(await blob(t.files['data.json']));const hist=t.files['history.json']?JSON.parse(await blob(t.files['history.json'])):[];
  const seen=new Set(hist.map(w=>w.id));data.workouts=hist.concat((data.workouts||[]).filter(w=>!seen.has(w.id))).sort((a,b)=>a.date<b.date?-1:1);delete data.histCount;return{data,files:t.files}}
export async function pushSync(){
  if(!SY.token||!navigator.onLine)return;
  try{
    const t=await tree();const parts=splitData();const entries=[];let changed=false;
    const ptree=await photos.pushBlobs(t);if(ptree.length){entries.push(...ptree);changed=true}
    for(const [name,content] of [['data.json',parts.data],['history.json',parts.history]]){
      const h=await hash(content);if(t&&t.files[name]&&SY.shas[name]===h)continue;
      const b=await gh('/git/blobs',{method:'POST',body:JSON.stringify({content:b64e(content),encoding:'base64'})});
      entries.push({path:name,mode:'100644',type:'blob',sha:b.sha});SY.shas[name]=h;changed=true;
    }
    if(changed){
      const nt=await gh('/git/trees',{method:'POST',body:JSON.stringify({base_tree:t?t.tree:undefined,tree:entries})});
      const c=await gh('/git/commits',{method:'POST',body:JSON.stringify({message:'Backup '+new Date().toLocaleString('de-DE'),tree:nt.sha,parents:t?[t.commit]:[]})});
      if(t)await gh('/git/refs/heads/main',{method:'PATCH',body:JSON.stringify({sha:c.sha})});else await gh('/git/refs',{method:'POST',body:JSON.stringify({ref:'refs/heads/main',sha:c.sha})});
    }
    SY.last=Date.now();SY.pending=false;SY.state='ok';saveSY();setStatus();
  }catch(e){SY.state='err:'+e.message;saveSY();setStatus()}
}
export async function pullSync(force){
  if(!SY.token||!navigator.onLine)return;
  try{
    const g=await getAll();if(!g){await pushSync();return}
    photos.mergeRemote(g.files);
    if(force||(g.data.updatedAt||0)>(S.updatedAt||0)){replaceState(g.data);const p=splitData();SY.shas={'data.json':await hash(p.data),'history.json':await hash(p.history)};SY.state='ok';SY.last=Date.now();SY.pending=false;saveSY();if(force)toast('Backup wiederhergestellt')}
    else if(SY.pending||(S.updatedAt||0)>(g.data.updatedAt||0))await pushSync();
    else{SY.state='ok';saveSY()}
    setStatus();
  }catch(e){SY.state='err:'+e.message;saveSY();setStatus()}
}
export function syncText(){
  if(!SY.token)return'Kein Cloud-Backup eingerichtet';
  if(SY.state.startsWith('err'))return'Backup fehlgeschlagen ('+SY.state.slice(4)+') – Token und Repo prüfen';
  if(SY.pending)return navigator.onLine?'Änderungen werden gesichert…':'Offline – wird gesichert, sobald Netz da ist';
  return SY.last?'Gesichert '+new Date(SY.last).toLocaleString('de-DE',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'Bereit';
}
export function setStatus(t){const e=el('syncStatus');if(e)e.textContent=t||syncText()}
export function connect(repo,token){SY.repo=repo.trim().replace(/^https?:\/\/github\.com\//,'').replace(/\/$/,'');SY.token=token.trim();SY.shas={};SY.state='off';saveSY();return SY.token?pullSync():Promise.resolve()}

on('save',scheduleSync);
window.addEventListener('online',()=>{if(SY.pending)pushSync()});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')pullSync()});
