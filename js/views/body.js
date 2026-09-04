import {S,save,today,fmtD,MEAS,trend,esc} from '../state.js';
import {toast,rerender,el} from '../ui.js';
import {lineChart} from '../charts.js';
import {startTimer} from '../timer.js';
import * as photos from '../photos.js';

let range='3m';
const RANGES=[['3m','3M'],['1y','1J'],['all','Alles']];
function inRange(ws){if(range==='all')return ws;const cut=new Date(Date.now()-(range==='3m'?90:365)*864e5).toISOString().slice(0,10);const f=ws.filter(x=>x.d>=cut);return f.length>1?f:ws.slice(-2)}
function html(){
  const ws=[...S.weights].sort((a,b)=>a.d<b.d?-1:1),last=ws[ws.length-1],wk=ws.filter(x=>x.d>=new Date(Date.now()-7*864e5).toISOString().slice(0,10));
  const avg=wk.length?wk.reduce((a,x)=>a+x.w,0)/wk.length:null;
  const m=[...S.measures].sort((a,b)=>a.d<b.d?-1:1),ml=m[m.length-1],mt=m.find(x=>x.d===today())||{};
  const f=(k,lab)=>`<div><label class="f">${lab}</label><input type="number" inputmode="decimal" step="0.5" id="ms_${k}" value="${mt[k]??''}" placeholder="${ml?.[k]??'cm'}"></div>`;
  const mrow=x=>[['Bauch',x.waist],['Brust',x.chest],['Arm',x.armL||x.arm,x.armR],['Bein',x.thighL||x.thigh,x.thighR]].filter(a=>a[1]||a[2]).map(a=>a.length>2&&a[2]?`${a[0]} ${a[1]||'–'} / ${a[2]}`:`${a[0]} ${a[1]||a[2]}`).join(' · ');
  return `<h1>Körper<small>Gewicht, Maße, Fotos</small></h1>
  <div class="card"><div class="row"><div class="grow"><label class="f">Gewicht heute (kg)</label><input type="number" inputmode="decimal" step="0.1" id="wIn" value="${ws.find(x=>x.d===today())?.w??''}" placeholder="${last?last.w:'z. B. 82.5'}"></div><button class="btn primary" data-a="savew" style="margin-top:18px">Speichern</button></div></div>
  <div class="grid2">
    <div class="card"><div class="tiny">Aktuell</div><div class="big num">${last?last.w.toFixed(1):'–'}<span class="tiny"> kg</span></div><div class="tiny">${last?fmtD(last.d):''}</div></div>
    <div class="card"><div class="tiny">Ø 7 Tage</div><div class="big num">${avg?avg.toFixed(1):'–'}<span class="tiny"> kg</span></div><div class="tiny">${wk.length} ${wk.length===1?'Eintrag':'Einträge'}</div></div>
  </div>
  <div class="card"><div class="row between mb2"><span class="muted">Gewicht</span><span>${RANGES.map(([k,l])=>`<button class="chip ${range===k?'on':''}" data-a="range" data-r="${k}" style="margin:0 0 0 4px">${l}</button>`).join('')}</span></div><canvas id="c2"></canvas><div class="tiny right"><span style="color:var(--accent2)">■</span> Trend&nbsp;&nbsp;<span style="color:var(--ink3)">●</span> Tageswerte</div></div>
  <h2>Maße</h2>
  <div class="card">
    <div class="grid2">${f('waist','Bauch')}${f('chest','Brust')}</div><div class="grid2 mt2">${f('armL','Arm links')}${f('armR','Arm rechts')}</div><div class="grid2 mt2">${f('thighL','Bein links')}${f('thighR','Bein rechts')}</div>
    <button class="btn primary wide mt3" data-a="savem">Maße speichern</button>
    ${m.length?`<div class="list mt3">${m.slice(-5).reverse().map(x=>`<div class="item top"><span class="muted" style="min-width:52px">${fmtD(x.d)}</span><span class="num tiny right">${mrow(x)}</span></div>`).join('')}</div>`:'<div class="tiny mt2">Alle 2–4 Wochen messen reicht.</div>'}
  </div>
  <h2>Fotos</h2>
  <div class="card"><div class="grid2"><label class="btn primary">Foto aufnehmen<input type="file" accept="image/*" capture="environment" id="phCam" hidden></label><label class="btn">Aus Galerie<input type="file" accept="image/*" id="phLib" hidden></label></div>
    <div class="pgrid" id="pgrid"></div><div class="tiny mt2">Alle 2–4 Wochen, gleiche Pose, gleiches Licht. Fotos liegen komprimiert auf dem Gerät und im Cloud-Backup.</div></div>
  <h2>Pausen-Timer</h2>
  <div class="grid4">${[60,90,120,180].map(s=>`<button class="btn" data-a="timer" data-s="${s}">${s>=120?s/60+' min':s+' s'}</button>`).join('')}</div>
  ${ws.length?`<h2>Einträge</h2><div class="card list">${ws.slice(-10).reverse().map(x=>`<div class="item"><span class="muted">${fmtD(x.d)}</span><span class="row"><span class="num">${x.w.toFixed(1)} kg</span><button class="btn ghost sm" data-a="rmw" data-d="${x.d}">✕</button></span></div>`).join('')}</div>`:''}`;
}
export default{html,
  after(){const ws=inRange([...S.weights].sort((a,b)=>a.d<b.d?-1:1));lineChart(document.getElementById('c2'),trend(ws),ws.map(x=>({d:x.d,y:x.w})),' kg');photos.loadMeta().then(photos.renderGrid)},
  action(a,d){
    if(a==='savew'){const v=+el('wIn').value;if(!v)return;S.weights=S.weights.filter(x=>x.d!==today());S.weights.push({d:today(),w:v});save();toast('Gespeichert');rerender()}
    if(a==='rmw'){S.weights=S.weights.filter(x=>x.d!==d.d);save();rerender()}
    if(a==='savem'){const e={d:today()};MEAS.map(x=>x[0]).forEach(k=>{const v=+el('ms_'+k).value;if(v)e[k]=v});if(Object.keys(e).length<2)return;S.measures=S.measures.filter(x=>x.d!==today());S.measures.push(e);save();toast('Gespeichert');rerender()}
    if(a==='range'){range=d.r;rerender()}
    if(a==='timer')startTimer(+d.s);
    if(a==='pview')photos.view(d.id);if(a==='pall')photos.viewAll();
  },
  change(t){if(t.id==='phCam'||t.id==='phLib'){photos.add(t.files[0]);t.value=''}}};
