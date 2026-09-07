import {S,esc,fmtD,fmtDL,de,exHistory,allExercises,recentExercises,work,weeklyMuscleVolume,prWall,nextRoundGoal,allTimeBest,macroAdherence,strengthTrend,monthlyPhotoPairs} from '../state.js';
import {sheet,closeSheet,rerender,el} from '../ui.js';
import {lineChart} from '../charts.js';
import {bodySVG,GROUPS} from '../muscles.js';
import {findLift,classifyStandard} from '../standards.js';
import * as photos from '../photos.js';

let ex=null,range='3m',bodyView='front',wallN=40;
let bodyOpen=false,macroMetric='p',macroRange=7,strengthRange=30;
const filt=h=>{if(range==='all')return h;const cut=new Date(Date.now()-(range==='3m'?90:365)*864e5).toISOString();const f=h.filter(x=>x.d>=cut);return f.length>1?f:h.slice(-2)};
function heaviest(name){let m={w:0,r:0};S.workouts.forEach(x=>{const h=x.exercises.find(y=>y.name===name);if(h)work(h).forEach(t=>{if(t.w>m.w)m=t})});return m}

function heatmapCard(){
  const vols=weeklyMuscleVolume(),has=Object.keys(vols).length;
  if(!bodyOpen){
    const top=Object.entries(vols).sort((a,b)=>b[1]-a[1]).slice(0,3);
    return `<div class="card"><button class="row between" data-a="bopen" style="width:100%;text-align:left"><div><span class="muted">Muskelgruppen · letzte 7 Tage</span>${has?`<div class="tiny mt1">${top.map(([g,v])=>g+' '+de(Math.round(v))+' kg').join(' · ')}</div>`:'<div class="tiny mt1">Noch kein Training diese Woche.</div>'}</div><span class="tiny">Anzeigen ›</span></button></div>`;
  }
  const legend=GROUPS.map(g=>`<div class="row" style="gap:4px"><i class="dot" style="background:${vols[g]?'var(--accent2)':'var(--bg3)'}"></i><span class="tiny">${g}${vols[g]?' · '+de(Math.round(vols[g]))+' kg':''}</span></div>`).join('');
  return `<div class="card">
    <button class="row between mb2" data-a="bopen" style="width:100%;text-align:left"><span class="muted">Muskelgruppen · letzte 7 Tage</span><span class="tiny">Einklappen ‹</span></button>
    <div class="row between mb2"><span></span><span><button class="chip ${bodyView==='front'?'on':''}" data-a="bview" data-v="front" style="margin:0 0 0 4px">Vorne</button><button class="chip ${bodyView==='back'?'on':''}" data-a="bview" data-v="back" style="margin:0">Hinten</button></span></div>
    <div class="body-svg">${bodySVG(bodyView,vols)}</div>
    <div class="body-legend">${legend}</div>
  </div>`;
}

const MACRO_LABEL={p:'Protein',c:'Carbs',f:'Fett',k:'Kalorien'};
function macroCard(){
  const pts=macroAdherence(macroMetric,macroRange);
  const avg=pts.length?Math.round(pts.reduce((a,x)=>a+x.y,0)/pts.length):null;
  return `<h2>Makro-Treue</h2>
  <div class="card">
    <div class="row between mb2"><span>${[['p','Protein'],['k','Kalorien'],['c','Carbs'],['f','Fett']].map(([k,l])=>`<button class="chip ${macroMetric===k?'on':''}" data-a="mmetric" data-v="${k}" style="margin:0 4px 6px 0">${l}</button>`).join('')}</span></div>
    <div class="row between mb2"><span class="muted">${MACRO_LABEL[macroMetric]} in % vom Tagesziel</span><span>${[[7,'7 T'],[30,'1 M'],[182,'6 M']].map(([k,l])=>`<button class="chip ${macroRange===k?'on':''}" data-a="mrange" data-v="${k}" style="margin:0 0 0 4px">${l}</button>`).join('')}</span></div>
    <canvas id="cMacro"></canvas>
    ${avg!==null?`<div class="tiny mt2">Ø ${avg} % des Ziels über ${pts.length} erfasste Tage</div>`:'<div class="empty">Noch keine Einträge in diesem Zeitraum.</div>'}
  </div>`;
}

function strengthCard(){
  const pts=strengthTrend(strengthRange);
  return `<h2>Kraftentwicklung</h2>
  <div class="card">
    <div class="row between mb2"><span class="muted">Summe geschätztes 1RM · Main-Übungen</span><span>${[[30,'1 M'],[182,'6 M'],[365,'1 J']].map(([k,l])=>`<button class="chip ${strengthRange===k?'on':''}" data-a="srange" data-v="${k}" style="margin:0 0 0 4px">${l}</button>`).join('')}</span></div>
    <canvas id="cStrength"></canvas>
    ${!pts.length?'<div class="empty">Noch keine Main-Übung mit Trainingshistorie.</div>':''}
  </div>`;
}

function photoCompareCard(){
  const pairs=monthlyPhotoPairs(photos.PH);
  if(!photos.PH.length)return `<h2>Fotovergleich</h2><div class="card"><div class="empty">Noch keine Fotos. Nimm z. B. jeden Sonntag eines auf – hier erscheint dann automatisch der Vergleich zum Vormonat.</div></div>`;
  if(!pairs.length)return `<h2>Fotovergleich</h2><div class="card"><div class="empty">Noch kein Foto mit ~30 Tagen Abstand gefunden. Sobald du regelmäßig (z. B. sonntags) fotografierst, erscheint hier der Monatsvergleich.</div></div>`;
  return `<h2>Fotovergleich · monatlich</h2>
  ${pairs.slice(0,6).map(pr=>`<div class="card">
    <div class="row between mb2"><span class="muted">${fmtD(pr.newer.d)} vs. ${fmtD(pr.older.d)}</span><span class="tiny">${pr.days} Tage</span></div>
    <div class="pcmp" id="pc-${pr.newer.id}-${pr.older.id}" data-a="pcpair" data-new="${pr.newer.id}" data-old="${pr.older.id}"><div class="more" style="aspect-ratio:3/4">…</div><div class="more" style="aspect-ratio:3/4">…</div></div>
  </div>`).join('')}`;
}

function html(){
  const all=allExercises();if(!ex||!all.includes(ex))ex=all[0]||null;
  const top=`<h1>Fortschritt</h1>${heatmapCard()}${macroCard()}${strengthCard()}${photoCompareCard()}<h2>Übung im Detail</h2>`;
  if(!ex)return `${top}<div class="empty">Sobald du Trainings gespeichert hast, siehst du hier deine Entwicklung pro Übung.</div>`;
  const sel=`<select id="pexSel" class="mb2">${all.map(n=>`<option ${n===ex?'selected':''}>${esc(n)}</option>`).join('')}</select><div class="mb2">${recentExercises(4).map(n=>`<button class="chip ${n===ex?'on':''}" data-a="pex" data-n="${esc(n)}">${esc(n)}</button>`).join('')}</div>`;
  const h=filt(exHistory(ex)),last=h[h.length-1];
  const wall=`<button class="btn wide mt2" data-a="wall">PR-Wand</button>`;
  if(!last)return `${top}${sel}<div class="empty">Keine Sätze mit Gewicht für diese Übung.</div>${wall}`;
  const pr=h.reduce((a,x)=>x.rm>a.rm?x:a,h[0]),hv=heaviest(ex);
  return `${top}${sel}
  <div class="card"><div class="row between mb2"><span class="muted">Geschätztes 1RM</span><span>${[['3m','3M'],['1y','1J'],['all','Alles']].map(([k,l])=>`<button class="chip ${range===k?'on':''}" data-a="range" data-r="${k}" style="margin:0 0 0 4px">${l}</button>`).join('')}</span></div><canvas id="c1"></canvas></div>
  <div class="grid2">
    <div class="card"><div class="tiny">Bestleistung</div><div class="big num">${pr.w} × ${pr.r}</div><div class="tiny">${fmtD(pr.d)} · 1RM ≈ ${Math.round(pr.rm)} kg</div></div>
    <div class="card"><div class="tiny">Schwerster Satz</div><div class="big num">${hv.w} × ${hv.r}</div><div class="tiny">PR Gewicht</div></div>
    <div class="card"><div class="tiny">Zuletzt</div><div class="big num">${last.w} × ${last.r}</div><div class="tiny">${fmtD(last.d)} · Volumen ${last.vol} kg</div></div>
  </div>
  ${goalCard()}${standardCard()}
  <div class="card list">${h.slice(-10).reverse().map(x=>`<div class="item"><span class="muted">${fmtD(x.d)}</span><span class="num">${x.w} × ${x.r} <span class="tiny">≈ ${Math.round(x.rm)} kg</span></span></div>`).join('')}</div>
  ${wall}`;
}

function standardCard(){
  const lift=findLift(ex);if(!lift)return'';
  const last=[...S.weights].sort((a,b)=>a.d<b.d?-1:1).slice(-1)[0];if(!last)return'';
  const b=allTimeBest(ex);if(!b.brm)return'';
  const c=classifyStandard(lift,last.w,b.brm);
  return `<div class="card">
    <div class="row between"><span class="muted">Kraftstandard · ${lift.label}</span><span class="tiny">${(c.ratio).toFixed(2)}× Körpergewicht</span></div>
    <div class="big num mt1">${c.tierName}</div>
    <div class="stdbar mt2"><i style="width:${Math.min(100,c.ratio/lift.tiers[lift.tiers.length-1]*100)}%"></i></div>
    ${c.nextName?`<div class="tiny mt2">Noch ${Math.max(0,c.nextKg-Math.round(b.brm))} kg (1RM) bis "${c.nextName}"</div>`:'<div class="tiny mt2">Höchste Stufe erreicht.</div>'}
    <div class="tiny mt2" style="color:var(--ink3)">Grobe Richtwerte, nicht wissenschaftlich – ohne Berücksichtigung von Geschlecht, Alter oder Trainingsjahren.</div>
  </div>`;
}
function goalCard(){
  const g=nextRoundGoal(ex);if(!g)return'';
  return `<div class="card">
    <div class="row between"><span class="muted">Nächstes Ziel</span><span class="tiny num">${g.current} / ${g.target} kg</span></div>
    <div class="bar mt2"><i style="width:${g.pct}%"></i></div>
    <div class="tiny mt2">Noch ${(g.target-g.current).toFixed(1)} kg bis ${g.target} kg</div>
  </div>`;
}
function wallSheet(){
  const draw=()=>{
    const events=prWall(),shown=events.slice(0,wallN);
    sheet(`<h3>PR-Wand</h3><div class="tiny mb3">${events.length} Bestleistungen insgesamt, neueste zuerst.</div>
    <div class="list">${shown.map(e=>`<div class="item"><div class="grow"><div style="font-weight:600">${esc(e.exercise)}</div><div class="tiny">${fmtDL(e.date)}</div></div><div class="right"><span class="tag ${e.type==='1RM'?'main':''}">${e.type}</span><div class="num tiny mt1">${e.value}</div></div></div>`).join('')||'<div class="empty">Noch keine zweite Session pro Übung – Bestleistungen erscheinen ab dem zweiten Training.</div>'}</div>
    ${events.length>wallN?`<button class="btn wide mt3" data-x="more">Mehr laden (${events.length-wallN} weitere)</button>`:''}
    <button class="btn ghost wide mt2" data-x="close">Schließen</button>`,{close:closeSheet,more:()=>{wallN+=40;draw()}});
  };draw();
}

async function loadPhotoThumbs(){
  for(const pr of monthlyPhotoPairs(photos.PH).slice(0,6)){
    const box=el('pc-'+pr.newer.id+'-'+pr.older.id);if(!box)continue;
    const [older,newer]=await Promise.all([photos.ensurePhoto(pr.older.id),photos.ensurePhoto(pr.newer.id)]);
    box.innerHTML=(older?`<img src="data:image/jpeg;base64,${older.data}">`:'<div class="more">☁︎</div>')+(newer?`<img src="data:image/jpeg;base64,${newer.data}">`:'<div class="more">☁︎</div>');
  }
}

export default{html,
  after(){
    const h=filt(exHistory(ex));if(ex)lineChart(document.getElementById('c1'),h.map(x=>({d:x.d,y:Math.round(x.rm)})),null,' kg');
    if(bodyOpen){/* svg is inline, nothing to draw */}
    const mpts=macroAdherence(macroMetric,macroRange);lineChart(document.getElementById('cMacro'),mpts,null,' %',{ref:100,refLabel:'Ziel'});
    const spts=strengthTrend(strengthRange);lineChart(document.getElementById('cStrength'),spts,null,' kg');
    loadPhotoThumbs();
  },
  action(a,d){
    if(a==='pex'){ex=d.n;rerender()}
    if(a==='range'){range=d.r;rerender()}
    if(a==='bview'){bodyView=d.v;rerender()}
    if(a==='bopen'){bodyOpen=!bodyOpen;rerender()}
    if(a==='mmetric'){macroMetric=d.v;rerender()}
    if(a==='mrange'){macroRange=+d.v;rerender()}
    if(a==='srange'){strengthRange=+d.v;rerender()}
    if(a==='wall'){wallN=40;wallSheet()}
    if(a==='pcpair'){photos.view(d.new,d.old)}
  },
  change(t){if(t.id==='pexSel'){ex=t.value;rerender()}}};
