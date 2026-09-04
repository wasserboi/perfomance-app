import {S,esc,fmtD,exHistory,allExercises,recentExercises,work} from '../state.js';
import {rerender} from '../ui.js';
import {lineChart} from '../charts.js';

let ex=null,range='1y';
const filt=h=>{if(range==='all')return h;const cut=new Date(Date.now()-(range==='3m'?90:365)*864e5).toISOString();const f=h.filter(x=>x.d>=cut);return f.length>1?f:h.slice(-2)};
function heaviest(name){let m={w:0,r:0};S.workouts.forEach(x=>{const h=x.exercises.find(y=>y.name===name);if(h)work(h).forEach(t=>{if(t.w>m.w)m=t})});return m}

function html(){
  const all=allExercises();if(!ex||!all.includes(ex))ex=all[0]||null;
  if(!ex)return '<h1>Fortschritt</h1><div class="empty">Sobald du Trainings gespeichert hast, siehst du hier deine Entwicklung pro Übung.</div>';
  const sel=`<select id="pexSel" class="mb2">${all.map(n=>`<option ${n===ex?'selected':''}>${esc(n)}</option>`).join('')}</select><div class="mb2">${recentExercises(4).map(n=>`<button class="chip ${n===ex?'on':''}" data-a="pex" data-n="${esc(n)}">${esc(n)}</button>`).join('')}</div>`;
  const h=filt(exHistory(ex)),last=h[h.length-1];if(!last)return `<h1>Fortschritt</h1>${sel}<div class="empty">Keine Sätze mit Gewicht für diese Übung.</div>`;
  const pr=h.reduce((a,x)=>x.rm>a.rm?x:a,h[0]),hv=heaviest(ex);
  return `<h1>Fortschritt</h1>${sel}
  <div class="card"><div class="row between mb2"><span class="muted">Geschätztes 1RM</span><span>${[['3m','3M'],['1y','1J'],['all','Alles']].map(([k,l])=>`<button class="chip ${range===k?'on':''}" data-a="range" data-r="${k}" style="margin:0 0 0 4px">${l}</button>`).join('')}</span></div><canvas id="c1"></canvas></div>
  <div class="grid2">
    <div class="card"><div class="tiny">Bestleistung</div><div class="big num">${pr.w} × ${pr.r}</div><div class="tiny">${fmtD(pr.d)} · 1RM ≈ ${Math.round(pr.rm)} kg</div></div>
    <div class="card"><div class="tiny">Schwerster Satz</div><div class="big num">${hv.w} × ${hv.r}</div><div class="tiny">PR Gewicht</div></div>
    <div class="card"><div class="tiny">Zuletzt</div><div class="big num">${last.w} × ${last.r}</div><div class="tiny">${fmtD(last.d)} · Volumen ${last.vol} kg</div></div>
  </div>
  <div class="card list">${h.slice(-10).reverse().map(x=>`<div class="item"><span class="muted">${fmtD(x.d)}</span><span class="num">${x.w} × ${x.r} <span class="tiny">≈ ${Math.round(x.rm)} kg</span></span></div>`).join('')}</div>`;
}
export default{html,
  after(){const h=filt(exHistory(ex));lineChart(document.getElementById('c1'),h.map(x=>({d:x.d,y:Math.round(x.rm)})),null,' kg')},
  action(a,d){if(a==='pex'){ex=d.n;rerender()}if(a==='range'){range=d.r;rerender()}},
  change(t){if(t.id==='pexSel'){ex=t.value;rerender()}}};
