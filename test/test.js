// Kernflows der App in jsdom. Aufruf: npm test
const {JSDOM}=require('jsdom');const fs=require('fs');const path=require('path');const crypto=require('crypto');
const {indexedDB}=require('fake-indexeddb');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<script[^>]*module[^>]*><\/script>/,'');
const dom=new JSDOM(html,{url:'https://x.test/',pretendToBeVisual:true});
const w=dom.window;
// --- Mock: Git Data API + Open Food Facts + version.json ---
let repo={ref:null,commits:{},trees:{},blobs:{}};const sha=()=>crypto.randomBytes(20).toString('hex');let blobPosts=0;
const off={status:1,product:{code:'1',product_name_de:'Skyr',brands:'Arla',quantity:'450 g',nutriments:{proteins_100g:11,carbohydrates_100g:4,fat_100g:0.2,'energy-kcal_100g':63}}};
w.fetch=async(url,o={})=>{const ok=j=>({ok:true,status:200,json:async()=>j});
  if(url.includes('version.json'))return ok({version:'13'});
  if(url.includes('openfoodfacts'))return url.includes('api/v2')?ok(off):ok({products:[off.product]});
  const p=url.replace(/^.*\/repos\/[^/]+\/[^/]+/,'');const body=o.body?JSON.parse(o.body):null;
  if(p==='/git/ref/heads/main')return repo.ref?ok({object:{sha:repo.ref}}):{status:404,ok:false};
  if(p.startsWith('/git/commits/'))return ok(repo.commits[p.split('/')[3]]);
  if(p.startsWith('/git/trees/'))return ok(repo.trees[p.split('/')[3]]);
  if(p.startsWith('/git/blobs/'))return ok({content:repo.blobs[p.split('/')[3]]});
  if(p==='/git/blobs'){blobPosts++;const s=sha();repo.blobs[s]=body.content;return ok({sha:s})}
  if(p==='/git/trees'){const base=body.base_tree?repo.trees[body.base_tree].tree:[];const map={};base.forEach(e=>map[e.path]=e);body.tree.forEach(e=>{if(e.sha===null)delete map[e.path];else map[e.path]=e});const s=sha();repo.trees[s]={tree:Object.values(map)};return ok({sha:s})}
  if(p==='/git/commits'){const s=sha();repo.commits[s]={tree:{sha:body.tree}};return ok({sha:s})}
  if(p==='/git/refs/heads/main'||p==='/git/refs'){repo.ref=body.sha;return ok({})}
  return{ok:false,status:500}};
const ctx=new Proxy({},{get:()=>()=>ctx});w.HTMLCanvasElement.prototype.getContext=()=>ctx;
w.confirm=()=>true;w.indexedDB=indexedDB;w.crypto.subtle=crypto.webcrypto.subtle;w.TextEncoder=TextEncoder;w.scrollTo=()=>{};
Object.defineProperty(globalThis,'navigator',{value:w.navigator,configurable:true});
['window','document','localStorage','HTMLElement','Image','URL','Blob','FileReader','AudioContext','getComputedStyle','devicePixelRatio','indexedDB','fetch','confirm','caches','location','history'].forEach(k=>{try{global[k]=w[k]}catch(e){}});
global.crypto=w.crypto;global.TextEncoder=TextEncoder;global.btoa=s=>Buffer.from(s,'binary').toString('base64');global.atob=s=>Buffer.from(s,'base64').toString('binary');
global.getComputedStyle=()=>({getPropertyValue:()=>''});global.devicePixelRatio=1;
const d=w.document,errs=[];w.addEventListener('error',e=>errs.push(e.message));
const click=sel=>{const el=d.querySelector(sel);if(!el)throw new Error('no '+sel);el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}))};
const clickAll=(sel,n)=>{for(let i=0;i<n;i++)d.querySelectorAll(sel)[i].dispatchEvent(new w.MouseEvent('click',{bubbles:true}))};
const inp=(el,v)=>{el.value=v;el.dispatchEvent(new w.Event('input',{bubbles:true}))};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const store=()=>JSON.parse(w.localStorage.getItem('perf.v1'));
let fails=0;const check=(name,cond,info='')=>{console.log((cond?'✓ ':'✗ ')+name+(info?'  '+info:''));if(!cond)fails++};

(async()=>{
  await import(path.join(root,'js/app.js'));await sleep(80);
  // Dashboard
  check('Start-Tab Heute',d.querySelector('nav button.on').dataset.tab==='today');
  click('[data-a=supps]');click('[data-x=preset]');check('Standard-Stack',store().supps.length===4);click('[data-x=close]');
  check('Tagesplan-Abschnitte',d.querySelectorAll('.tick').length===5);
  const tsel='.card .list [data-a=tick]:not([data-act=weight])';
  click(tsel);check('Tipp 1 = erledigt',d.querySelector(tsel).classList.contains('done'));
  click(tsel);check('Tipp 2 = ausgelassen',d.querySelector(tsel).classList.contains('miss'));
  check('Habit-Grid da',d.querySelectorAll('.hab i').length>=14*4);
  click(tsel);check('Tipp 3 = offen',d.querySelector(tsel).className.trim()==='tick open'&&!Object.keys(store().checks).length);
  click(tsel);
  click('[data-tab=plans]');
  // Sync verbinden
  click('[data-a=settings]');inp(d.getElementById('syTok'),'tok');click('[data-x=connect]');await sleep(100);
  check('Sync verbunden',/Gesichert/.test(d.getElementById('syncStatus').textContent));click('[data-x=close]');
  // Plan: Main Bank 100kg, Flys Kabelturm
  click('[data-a=edit]');click('[data-x=add]');click('[data-x=add]');inp(d.getElementById('pn'),'Push');
  inp(d.querySelectorAll('[data-pf=name]')[0],'Bank');click('[data-x=main]');inp(d.querySelector('[data-pf=weight]'),100);
  inp(d.querySelectorAll('[data-pf=name]')[1],'Flys');const sel=d.querySelectorAll('[data-pf=type]')[1];sel.value='Kabelturm';sel.dispatchEvent(new w.Event('change',{bubbles:true}));click('[data-x=save]');
  check('Plan gespeichert',store().plans.length===1&&store().plans[0].exercises[1].type==='Kabelturm');
  // Reihenfolge
  {const {moveItem}=await import(path.join(root,'js/views/plans.js'));const a=['A','B','C'];moveItem(a,0,2);check('moveItem verschiebt',a.join('')==='BCA');}
  click('[data-a=edit][data-id]');click('[data-x=down][data-i="0"]');check('Plan: Übung runter',d.querySelectorAll('[data-pf=name]')[0].value==='Flys');click('[data-x=up][data-i="1"]');check('Plan: Übung hoch',d.querySelectorAll('[data-pf=name]')[0].value==='Bank');click('[data-x=close]');
  click('[data-tab=log]');click('[data-a=start][data-id]');click('#app [data-a=menu][data-i="0"]');click('[data-x=down]');check('Training: Übung runter',store().active.exercises[0].name==='Flys');
  click('#app [data-a=menu][data-i="1"]');click('[data-x=up]');check('Training: Übung hoch',store().active.exercises[0].name==='Bank');
  click('[data-a=cancel]');
  // Training: 10x3 ok -> 7x5
  const session=(okSets,flysKg)=>{click('[data-tab=log]');click('[data-a=start][data-id]');clickAll('[data-a=done]',okSets);
    if(flysKg){const n=d.querySelectorAll('input[data-f=w]').length-1;inp(d.querySelectorAll('input[data-f=w]')[n],flysKg);inp(d.querySelectorAll('input[data-f=r]')[n],10);d.querySelectorAll('[data-a=done]')[n].dispatchEvent(new w.MouseEvent('click',{bubbles:true}))}
    click('[data-a=finish]');const t=d.querySelector('#sheet .in').textContent;click('[data-x=close]');return t};
  let t=session(10,20);check('Stufe 1 geschafft → 7×5',/7×5 mit 100/.test(t));
  click('[data-tab=log]');click('[data-a=start][data-id]');check('Overload-Vorschlag Flys +2.5',!!d.querySelector('.sug')&&d.querySelectorAll('input[data-f=w]')[d.querySelectorAll('input[data-f=w]').length-1].value==='22.5');
  click('[data-a=adj][data-f=w][data-d="2.5"]');check('±-Taste kg',d.querySelector('input[data-f=w]').value==='102.5');
  click('[data-a=cancel]');
  t=session(5);check('PR-Badge in Auswertung (100×5 > 100×3)',/PR 1RM/.test(t));
  t=session(5);check('Deload nach 2 Fehlversuchen',/95 kg – Deload/.test(t));
  check('Wochen-Serie in Übersicht',/Wochen in Folge/.test(d.querySelector('.week').textContent));
  // Fortschritt
  click('[data-tab=progress]');check('Fortschritt Dropdown',d.getElementById('pexSel').options.length===2);
  check('Fortschritt Standard 3M',d.querySelector('[data-a=range].on').dataset.r==='3m');click('[data-a=range][data-r=all]');check('Range wechselt',d.querySelector('[data-a=range].on').dataset.r==='all');
  // Körper
  click('[data-tab=body]');inp(d.getElementById('wIn'),90);click('[data-a=savew]');inp(d.getElementById('ms_armL'),40);inp(d.getElementById('ms_armR'),41);click('[data-a=savem]');
  check('Gewicht-Zeitraum 3M Standard',d.querySelector('[data-a=range].on').dataset.r==='3m');
  check('Gewicht + Maße',store().weights.length===1&&store().measures[0].armR===41);
  click('[data-a=timer]');check('Timer läuft',d.getElementById('timer').classList.contains('on'));
  // Makros
  click('[data-tab=macros]');click('[data-a=search]');inp(d.getElementById('fq'),'skyr');await sleep(700);click('#fres .food');if(d.querySelector('[data-x=mode][data-m=gram]'))click('[data-x=mode][data-m=gram]');inp(d.getElementById('fam'),400);click('[data-x=add]');
  check('Skyr 400 g gebucht',/44/.test(d.querySelector('.macro b').textContent));
  click('[data-a=search]');inp(d.getElementById('fq'),'Ei');await sleep(50);check('Basics: Ei zuerst, nicht Eis',/Ei \(Hühnerei\)/.test(d.querySelector('#fres .food .fn').textContent));click('#fres .food');check('Portion vorausgewählt (Ei M)',d.querySelector('[data-x=port].on').textContent.includes('Ei (M)'));click('[data-x=cnt][data-d="1"]');check('Anzahl 2 → 120 g',d.getElementById('ftot').textContent==='120 g');click('[data-x=add]');
  click('[data-a=meals]');inp(d.getElementById('mlname'),'Frühstück');click('[data-x=save]');click('[data-x=book]');check('Mahlzeit gebucht',store().macros[Object.keys(store().macros)[0]].length===4);
  click('[data-a=search]');inp(d.getElementById('fq'),'Wasser');await sleep(50);click('#fres .food');check('Getränk: Wasser-Umschalter aktiv',/Zählt als Wasser/.test(d.querySelector('#sheet').textContent));click('[data-x=port][data-i="1"]');click('[data-x=add]');check('500 ml auf Wasserzähler',/0,50/.test(d.querySelector('.big.num').textContent));
  click('[data-a=water]');check('Wasser +250',/0,75/.test(d.querySelector('.big.num').textContent));
  click('#recent .food');check('Zuletzt-Liste öffnet Menge',!!d.getElementById('fcalc'));click('[data-x=edit]');click('[data-x=close]');
  // Übungsverwaltung
  click('[data-tab=plans]');click('[data-a=settings]');click('[data-x=exmgr]');click('[data-x=pick]');inp(d.getElementById('exn'),'Bankdrücken');click('[data-x=rename]');
  check('Umbenannt',store().plans[0].exercises[0].name==='Bankdrücken');click('[data-x=close]');
  // Sync: nur geänderte Dateien
  await sleep(3400);const files=repo.trees[repo.commits[repo.ref].tree.sha].tree.map(e=>e.path);check('Repo-Dateien',files.includes('data.json')&&files.includes('history.json'),files.join(','));
  click('[data-tab=plans]');click('[data-a=settings]');click('[data-x=restore]');await sleep(200);check('Restore',store().workouts.length===3);click('[data-x=close]');
  check('Keine JS-Fehler',errs.length===0,errs.join(' | '));
  console.log(fails?`\n${fails} Test(s) fehlgeschlagen`:'\nAlle Tests bestanden');process.exit(fails?1:0);
})().catch(e=>{console.log('FAIL',e.stack);process.exit(1)});
