import {S,esc,fmtD,fmtDL,de,exHistory,allExercises,recentExercises,work,weeklyMuscleVolume,prWall,nextRoundGoal,allTimeBest} from '../state.js';
import {sheet,closeSheet,rerender,el} from '../ui.js';
import {lineChart} from '../charts.js';
import {bodySVG,GROUPS} from '../muscles.js';
import {findLift,classifyStandard} from '../standards.js';

let ex=null,range='3m',bodyView='front',wallN=40;
const filt=h=>{if(range==='all')return h;const cut=new Date(Date.now()-(range==='3m'?90:365)*864e5).toISOString();const f=h.filter(x=>x.d>=cut);return f.length>1?f:h.slice(-2)};
function heaviest(name){let m={w:0,r:0};S.workouts.forEach(x=>{const h=x.exercises.find(y=>y.name===name);if(h)work(h).forEach(t=>{if(t.w>m.w)m=t})});return m}

function heatmapCard(){
  const vols=weeklyMuscleVolume();
  const legend=GROUPS.map(g=>`<div class="row" style="gap:4px"><i class="dot" style="background:${vols[g]?'var(--accent2)':'var(--bg3)'}"></i><span class="tiny">${g}${vols[g]?' · '+de(Math.round(vols[g]))+' kg':''}</span></div>`).join('');
  return `<div class="card">
    <div class="row between mb2"><span class="muted">Muskelgruppen · letzte 7 Tage</span><span><button class="chip ${bodyView==='front'?'on':''}" data-a="bview" data-v="front" style="margin:0 0 0 4px">Vorne</button><button class="chip ${bodyView==='back'?'on':''}" data-a="bview" data-v="back" style="margin:0">Hinten</button></span></div>
    <div class="body-svg">${bodySVG(bodyView,vols)}</div>
    <div class="body-legend">${legend}</div>
    ${!Object.keys(vols).length?'<div class="tiny mt2">Noch kein Training diese Woche.</div>':''}
  </div>`;
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

function html(){
  const all=allExercises();if(!ex||!all.includes(ex))ex=all[0]||null;
  const heat=heatmapCard();
  if(!ex)return `<h1>Fortschritt</h1>${heat}<div class="empty">Sobald du Trainings gespeichert hast, siehst du hier deine Entwicklung pro Übung.</div>`;
  const sel=`<select id="pexSel" class="mb2">${all.map(n=>`<option ${n===ex?'selected':''}>${esc(n)}</option>`).join('')}</select><div class="mb2">${recentExercises(4).map(n=>`<button class="chip ${n===ex?'on':''}" data-a="pex" data-n="${esc(n)}">${esc(n)}</button>`).join('')}</div>`;
  const h=filt(exHistory(ex)),last=h[h.length-1];
  const wall=`<button class="btn wide mt2" data-a="wall">PR-Wand</button>`;
  if(!last)return `<h1>Fortschritt</h1>${heat}${sel}<div class="empty">Keine Sätze mit Gewicht für diese Übung.</div>${wall}`;
  const pr=h.reduce((a,x)=>x.rm>a.rm?x:a,h[0]),hv=heaviest(ex);
  return `<h1>Fortschritt</h1>${heat}${sel}
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

function wallSheet(){
  const draw=()=>{
    const events=prWall(),shown=events.slice(0,wallN);
    sheet(`<h3>PR-Wand</h3><div class="tiny mb3">${events.length} Bestleistungen insgesamt, neueste zuerst.</div>
    <div class="list">${shown.map(e=>`<div class="item"><div class="grow"><div style="font-weight:600">${esc(e.exercise)}</div><div class="tiny">${fmtDL(e.date)}</div></div><div class="right"><span class="tag ${e.type==='1RM'?'main':''}">${e.type}</span><div class="num tiny mt1">${e.value}</div></div></div>`).join('')||'<div class="empty">Noch keine zweite Session pro Übung – Bestleistungen erscheinen ab dem zweiten Training.</div>'}</div>
    ${events.length>wallN?`<button class="btn wide mt3" data-x="more">Mehr laden (${events.length-wallN} weitere)</button>`:''}
    <button class="btn ghost wide mt2" data-x="close">Schließen</button>`,{close:closeSheet,more:()=>{wallN+=40;draw()}});
  };draw();
}

export default{html,
  after(){const h=filt(exHistory(ex));lineChart(document.getElementById('c1'),h.map(x=>({d:x.d,y:Math.round(x.rm)})),null,' kg')},
  action(a,d){
    if(a==='pex'){ex=d.n;rerender()}
    if(a==='range'){range=d.r;rerender()}
    if(a==='bview'){bodyView=d.v;rerender()}
    if(a==='wall'){wallN=40;wallSheet()}
  },
  change(t){if(t.id==='pexSel'){ex=t.value;rerender()}}};
