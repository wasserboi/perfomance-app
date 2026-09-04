import {S,save,STAGES,stageLabel,esc,fmtD,fmtDL,de,vol,totalKg,planWorkouts,lastSets,compare,prsFor,allTimeBest,e1rm,pctS,pctC,startWorkout,finishWorkout,today} from '../state.js';
import {sheet,closeSheet,toast,prompt2,confirm2,rerender,render,svgCheck} from '../ui.js';
import {moveItem} from './plans.js';
import {startTimer,stopTimer} from '../timer.js';

let histN=8;
const days=d=>Math.floor((Date.now()-new Date(d))/864e5);
const ago=d=>{if(!d)return'noch nie';const n=days(d);return n===0?'heute':n===1?'gestern':'vor '+n+' Tagen'};

function weekStreak(){const set=new Set(S.workouts.map(w=>w.date.slice(0,10)));const end=new Date();end.setHours(12,0,0,0);let n=0;
  for(let k=0;k<200;k++){const m=new Date(end);m.setDate(end.getDate()-((end.getDay()+6)%7)-7*k);let hit=false;
    for(let i=0;i<7;i++){const x=new Date(m);x.setDate(m.getDate()+i);if(set.has(x.toISOString().slice(0,10)))hit=true}
    if(hit)n++;else if(k>0)break}
  return n}
function overview(){
  const mon=new Date();mon.setHours(0,0,0,0);mon.setDate(mon.getDate()-((mon.getDay()+6)%7));const wk=S.workouts.filter(w=>new Date(w.date)>=mon);
  const recent=S.workouts.slice(-histN).reverse();
  return `<h1>Training<small>${new Date().toLocaleDateString('de-DE',{weekday:'long',day:'numeric',month:'long'})}</small></h1>
  <h2 style="margin-top:0">Diese Woche</h2>
  <div class="week"><div class="stat"><b>${wk.length}</b><small>Einheiten</small></div><div class="stat"><b class="num">${de(wk.reduce((a,w)=>a+vol(w),0)/1000,{maximumFractionDigits:1})}</b><small>Tonnen</small></div><div class="stat"><b class="num">${weekStreak()}</b><small>Wochen in Folge</small></div></div>
  ${S.workouts.length?`<div class="tiny mb2" style="margin-left:2px">${Math.round(wk.reduce((a,w)=>a+w.duration,0))?Math.round(wk.reduce((a,w)=>a+w.duration,0)/60)+' Minuten diese Woche · ':''}Insgesamt ${de(totalKg()/1000,{maximumFractionDigits:1})} t in ${S.workouts.length} Trainings seit ${new Date(S.workouts[0].date).toLocaleDateString('de-DE',{month:'short',year:'numeric'})}</div>`:''}
  <h2>Workout starten</h2>
  <div class="card stack">
    ${S.plans.map(p=>{const l=planWorkouts(p.id,p.name).slice(-1)[0];return`<button class="planbtn" data-a="start" data-id="${p.id}"><span>${esc(p.name)}</span><span class="tiny ${l&&days(l.date)>7?'stale':''}">${ago(l&&l.date)}</span></button>`}).join('')}
    <button class="btn wide ${S.plans.length?'':'primary'}" data-a="start">Freies Training</button>
  </div>
  <h2>Verlauf</h2>
  ${recent.length?recent.map(w=>{const h=planWorkouts(w.planId,w.name),i=h.findIndex(x=>x.id===w.id),c=i>0?compare(w,h[i-1]):null,pn=prsFor(w).n;
    return`<div class="card row between" data-a="show" data-id="${w.id}"><div class="grow"><div style="font-weight:600">${esc(w.name)}</div><div class="tiny">${fmtDL(w.date)} · ${w.exercises.length} Übungen · ${Math.round(w.duration/60)} min</div></div><div class="num right">${c?`<div class="${pctC(c.pct)}" style="font-weight:600">${pctS(c.pct)}</div>`:''}${pn?`<div class="tiny warn">${pn} PR${pn>1?'s':''}</div>`:''}<div class="muted">${de(vol(w))} kg</div></div></div>`}).join(''):'<div class="empty">Noch kein Training gespeichert.</div>'}
  ${S.workouts.length>histN?`<button class="btn wide" data-a="more">Mehr laden (${S.workouts.length-histN} weitere)</button>`:''}`;
}

function active(){
  const a=S.active,min=Math.round((Date.now()-a.start)/60000);
  return `<div class="row between" style="margin:6px 0 14px"><h1 class="sm" style="margin:0">${esc(a.name)}<small>${min} min · ${de(vol(a))} kg${a.basedOn?' · Basis: letztes Training':''}</small></h1><button class="btn ghost danger sm" data-a="cancel">Abbrechen</button></div>
  ${a.exercises.map((ex,ei)=>{const prev=lastSets(ex.name);return`<div class="card ex" data-row="${ei}">
    <div class="row between top"><button class="drag" data-drag="${ei}" aria-label="Verschieben">≡</button><div class="grow"><div class="tags">${ex.main?'<span class="tag main">Main</span>':''}${ex.type?`<span class="tag">${ex.type}</span>`:''}${ex.sug?`<span class="sug">↑ +${String(ex.sug).replace('.',',')} kg</span>`:''}</div><div class="name">${esc(ex.name)}</div></div><button class="icon" data-a="note" data-i="${ei}">✎</button><button class="icon" data-a="rmex" data-i="${ei}">✕</button></div>
    ${ex.main?`<div class="stagebar">${STAGES.map((c,i)=>`<span class="${i===ex.stage?'on':i<ex.stage?'ok':''}">${c.sets}×${c.reps}</span>`).join('')}</div><div class="prev">Ziel ${STAGES[ex.stage].sets} × ${STAGES[ex.stage].reps} mit ${ex.sets.find(s=>!s.wu)?.w} kg</div>`:`<div class="prev">${prev?'Letztes Mal: '+prev.slice(0,6).map(s=>s.w+'×'+s.r).join(', ')+(prev.length>6?' …':''):'Erstes Mal'}${ex.targetReps?' · Ziel '+ex.targetReps+' Reps':''}</div>`}
    ${S.exNotes[ex.name]?`<div class="note">${esc(S.exNotes[ex.name])}</div>`:''}
    <div class="sets"><div class="h">Satz</div><div class="h">kg</div><div class="h">Reps</div><div class="h"></div>
    ${ex.sets.map((s,si)=>`<div class="n ${s.wu?'wu':''}" data-a="wu" data-i="${ei}" data-s="${si}">${s.wu?'W':si+1}</div>
      <div class="cell ${s.done?'done':''}"><button data-a="adj" data-f="w" data-d="-2.5" data-i="${ei}" data-s="${si}">−</button><input type="number" inputmode="decimal" step="0.5" value="${s.w||''}" placeholder="${prev?.[si]?.w??''}" data-f="w" data-i="${ei}" data-s="${si}"><button data-a="adj" data-f="w" data-d="2.5" data-i="${ei}" data-s="${si}">+</button></div>
      <div class="cell ${s.done?'done':''}"><button data-a="adj" data-f="r" data-d="-1" data-i="${ei}" data-s="${si}">−</button><input type="number" inputmode="numeric" value="${s.r||''}" placeholder="${prev?.[si]?.r??ex.targetReps??''}" data-f="r" data-i="${ei}" data-s="${si}"><button data-a="adj" data-f="r" data-d="1" data-i="${ei}" data-s="${si}">+</button></div>
      <button class="ok ${s.done?'done':''}" data-a="done" data-i="${ei}" data-s="${si}">${svgCheck}</button>`).join('')}
    </div>
    <div class="row mt3"><button class="btn sm" data-a="addset" data-i="${ei}">+ Satz</button><button class="btn ghost sm" data-a="addwu" data-i="${ei}">+ Aufwärmsatz</button>${ex.sets.length>1?`<button class="btn ghost sm" data-a="rmset" data-i="${ei}">− Satz</button>`:''}</div>
  </div>`}).join('')}
  <div class="tiny mb3">Satznummer antippen = Aufwärmsatz (zählt nicht für Score und Volumen). Am ≡ ziehen, um Übungen umzusortieren.</div>
  <button class="btn wide mb2" data-a="addex">+ Übung hinzufügen</button>
  <button class="btn wide primary" data-a="finish">Training beenden</button>`;
}

export function summarySheet(id){
  const w=S.workouts.find(x=>x.id===id);if(!w)return;const hist=planWorkouts(w.planId,w.name),idx=hist.findIndex(x=>x.id===id);
  const prev=idx>0?hist[idx-1]:null,first=idx>0?hist[0]:null,cl=compare(w,prev),cf=idx>1?compare(w,first):null,prs=prsFor(w),mr=w.mainRes;
  const box=(l,c)=>c?`<div class="card sub"><div class="tiny">${l} · ${fmtD(c.date)}</div><div class="big num ${pctC(c.pct)}" style="font-size:30px">${pctS(c.pct)}</div><div class="tiny">Volumen ${pctS(c.vol)}</div></div>`:'';
  const mainBox=mr?`<div class="card sub ${mr.ok?'good':'warn'}"><div class="tiny">Main · ${esc(mr.name)} · 3-5-7</div><div style="font-weight:600;margin-top:2px">${mr.ok?'Stufe geschafft':'Nicht geschafft'} – ${mr.done}/${mr.need} Sätze mit ${STAGES[mr.from.stage].reps} Reps @ ${mr.from.weight} kg</div><div class="muted" style="margin-top:2px">Nächstes Mal: ${stageLabel(mr.to.stage)} mit ${mr.to.weight} kg${mr.deload?' – Deload nach zwei Fehlversuchen':mr.ok&&mr.to.stage===0?' – neues Ausgangsgewicht':mr.ok?'':' – wiederholen (zweiter Fehlversuch → Deload)'}</div></div>`:'';
  sheet(`<h3>${esc(w.name)}</h3>
  <div class="tiny mb3">${fmtDL(w.date)} · ${Math.round(w.duration/60)} min · ${de(vol(w))} kg bewegt${prs.n?` · <span class="warn" style="font-weight:600">${prs.n} PR${prs.n>1?'s':''}</span>`:''}</div>
  ${mainBox}
  ${cl||cf?`<div class="grid2">${box('vs. letztes Mal',cl)}${box('seit Aufzeichnung',cf)}</div><div class="tiny mb3 mt1">Kraft-Score = Summe der geschätzten 1RM aller Übungen, die in beiden Trainings vorkamen.</div>`:'<div class="muted mb3">Erstes Training mit diesem Plan – ab dem nächsten Mal siehst du hier den Vergleich.</div>'}
  <div class="card sub list">${w.exercises.map(x=>{const d=cl?.per.find(p=>p.name===x.name);return`<div class="item"><div class="grow"><div style="font-weight:600">${x.main?'<span class="tag main">Main</span>':''}${x.type?`<span class="tag">${x.type[0]}</span>`:''}${esc(x.name)}${(prs.per[x.name]||[]).map(p=>`<span class="pr">PR ${p}</span>`).join('')}</div><div class="tiny num">${x.sets.map(s=>(s.wu?'W ':'')+s.w+'×'+s.r).join(' · ')}</div></div>${d?`<span class="num ${pctC(d.pct)}" style="font-weight:600">${pctS(d.pct)}</span>`:'<span class="tiny">neu</span>'}</div>`}).join('')}</div>
  <button class="btn primary wide mt2" data-x="close">Fertig</button><button class="btn ghost danger wide mt2" data-x="del">Training löschen</button>`,
  {close:closeSheet,del:()=>{if(!confirm2('Löschen?'))return;S.workouts=S.workouts.filter(x=>x.id!==id);save();closeSheet();rerender()}});
}

function attachDrag(){
  const box=document.getElementById('app');if(!S.active)return;
  box.querySelectorAll('[data-drag]').forEach(h=>{
    h.addEventListener('pointerdown',ev=>{
      ev.preventDefault();let i=+h.dataset.drag;const row=h.closest('[data-row]');row.classList.add('dragging');
      try{h.setPointerCapture(ev.pointerId)}catch(_){}
      const move=e=>{const rows=[...box.querySelectorAll('[data-row]')];
        for(let k=0;k<rows.length;k++){if(k===i)continue;const r=rows[k].getBoundingClientRect();
          if(e.clientY>r.top&&e.clientY<r.bottom){moveItem(S.active.exercises,i,k);i=k;save();rerender();attachDrag();
            const nh=box.querySelector(`[data-drag="${k}"]`);if(nh){nh.closest('[data-row]').classList.add('dragging');try{nh.setPointerCapture(e.pointerId)}catch(_){}nh.addEventListener('pointermove',move);nh.addEventListener('pointerup',up)}
            break}}};
      const up=()=>{h.removeEventListener('pointermove',move);h.removeEventListener('pointerup',up);box.querySelectorAll('.dragging').forEach(x=>x.classList.remove('dragging'));rerender();attachDrag()};
      h.addEventListener('pointermove',move);h.addEventListener('pointerup',up);h.addEventListener('pointercancel',up);
    });
  });
}
export default{
  html:()=>S.active?active():overview(),
  after:attachDrag,
  action(a,d){
    const A=S.active;
    if(a==='start'){startWorkout(d.id);render(true)}
    if(a==='more'){histN+=20;rerender()}
    if(a==='show')summarySheet(d.id);
    if(a==='cancel'&&confirm2('Training verwerfen?')){S.active=null;stopTimer();save();render(true)}
    if(a==='finish'){const w=finishWorkout();if(!w){toast('Keine Sätze abgehakt');return}stopTimer();render(true);summarySheet(w.id)}
    if(a==='adj'){const s=A.exercises[d.i].sets[d.s];s[d.f]=Math.max(0,Math.round(((+s[d.f]||0)+ +d.d)*2)/2);save();rerender()}
    if(a==='done'){const s=A.exercises[d.i].sets[d.s];
      if(!s.done){const prev=lastSets(A.exercises[d.i].name);if(!s.w&&prev?.[d.s])s.w=prev[d.s].w;if(!s.r&&prev?.[d.s])s.r=prev[d.s].r;if(!s.w||!s.r){toast('kg und Reps eintragen');return}
        s.done=true;startTimer(S.settings.rest);if(navigator.vibrate)navigator.vibrate(30);
        if(!s.wu){const b=allTimeBest(A.exercises[d.i].name);if(b.bw&&(s.w>b.bw||e1rm(s.w,s.r)>b.brm+0.5))toast('PR! '+s.w+' kg × '+s.r)}}
      else s.done=false;save();rerender()}
    if(a==='wu'){const s=A.exercises[d.i].sets[d.s];s.wu=!s.wu;save();rerender()}
    if(a==='addwu'){A.exercises[d.i].sets.unshift({w:0,r:0,done:false,wu:true});save();rerender()}
    if(a==='addset'){const ss=A.exercises[d.i].sets,l=ss[ss.length-1];ss.push({w:l?l.w:0,r:l?l.r:0,done:false});save();rerender()}
    if(a==='rmset'){A.exercises[d.i].sets.pop();save();rerender()}
    if(a==='rmex'){A.exercises.splice(+d.i,1);save();rerender()}
    if(a==='addex')prompt2('Übung',n=>{if(!n)return;A.exercises.push({name:n,sets:[0,1,2].map(()=>({w:0,r:0,done:false}))});save();rerender()},'z. B. Bankdrücken');
    if(a==='note'){const n=A.exercises[d.i].name;prompt2(n,v=>{if(v)S.exNotes[n]=v;else delete S.exNotes[n];save();rerender()},'z. B. Sitz 4, enger Griff',S.exNotes[n]||'')}
  },
  input(t){if(t.dataset.f&&S.active){S.active.exercises[t.dataset.i].sets[t.dataset.s][t.dataset.f]=+t.value||0;save()}}
};
