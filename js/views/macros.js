import {S,save,today,fmtDL,esc,r1,kcalOf,dayIsTrain,recentFoods} from '../state.js';
import {sheet,closeSheet,toast,rerender,el} from '../ui.js';
import {searchSheet,scanSheet,foodForm,mealsSheet,amountSheet,foodRow} from '../food.js';

let day=today();
const modes={hold:['Halten',0],gain:['Aufbau',0.25],cut:['Abnehmen',-0.4]};

function weekly(g,gk){
  const ds=[...Array(7)].map((_,i)=>{const d=new Date(day+'T12:00');d.setDate(d.getDate()-i);return d.toISOString().slice(0,10)}).filter(d=>(S.macros[d]||[]).length);if(ds.length<2)return'';
  const sum=ds.map(d=>S.macros[d].reduce((a,i)=>({p:a.p+i.p,c:a.c+i.c,f:a.f+i.f,k:a.k+kcalOf(i)}),{p:0,c:0,f:0,k:0}));const avg=k=>Math.round(sum.reduce((a,x)=>a+x[k],0)/ds.length);
  const ws=[...S.weights].sort((a,b)=>a.d<b.d?-1:1),ref=new Date(day+'T12:00');ref.setDate(ref.getDate()-7);const before=ws.filter(x=>x.d<=ref.toISOString().slice(0,10)).slice(-1)[0],now=ws.filter(x=>x.d<=day).slice(-1)[0];const dw=before&&now&&before.d!==now.d?now.w-before.w:null;
  const mode=modes[S.goalMode||'hold'];let sug='';
  if(dw!==null&&ds.length>=5){const adj=Math.round((mode[1]-dw)*7700/7/50)*50,cl=Math.max(-300,Math.min(300,adj));sug=Math.abs(cl)>=100?`<div class="row between mt2"><span class="tiny">Autopilot (${mode[0]}): ${cl>0?'+':''}${cl} kcal/Tag → ${gk+cl} kcal</span><button class="btn sm" data-a="applykcal" data-v="${cl}">Übernehmen</button></div>`:`<div class="tiny mt2">Autopilot (${mode[0]}): Kalorien passen.</div>`}
  return `<div class="card"><div class="row between"><span class="muted">Ø letzte ${ds.length} Tage</span><span class="tiny num">${avg('k')} kcal · P ${avg('p')} · C ${avg('c')} · F ${avg('f')}</span></div>${dw!==null?`<div class="tiny mt2">Gewicht in 7 Tagen: <span class="num ${Math.abs(dw)<0.3?'':dw>0?'warn':'good'}">${(dw>0?'+':'')+dw.toFixed(1)} kg</span> · Ziel: ${mode[0]} <button class="btn ghost xs" data-a="goalmode">ändern</button></div>`:''}${sug}</div>`;
}
function html(){
  const items=S.macros[day]||[],t=items.reduce((a,i)=>({p:a.p+i.p,c:a.c+i.c,f:a.f+i.f}),{p:0,c:0,f:0});
  const isT=dayIsTrain(day),g=isT?S.goals:(S.goalsRest||S.goals),gk=kcalOf(g),tk=items.reduce((a,i)=>a+kcalOf(i),0),isToday=day===today();
  const bar=(l,v,goal,u='g')=>`<div class="macro"><div class="row between"><span>${l}</span><span class="num"><b>${Math.round(v)}</b> <span class="tiny">/ ${goal} ${u}</span></span></div><div class="bar"><i class="${v>goal*1.1?'over':''}" style="width:${Math.min(100,v/goal*100)}%"></i></div></div>`;
  const ml=S.water[day]||0;
  return `<div class="row between" style="margin-top:6px"><h1 style="margin:0">Makros<small>${isToday?'Heute':fmtDL(day+'T12:00')} · noch ${Math.max(0,Math.round(g.p-t.p))} g Protein</small></h1><div class="row"><button class="btn ghost sm" data-a="day" data-o="-1">‹</button><button class="btn ghost sm" data-a="day" data-o="1" ${isToday?'disabled':''}>›</button></div></div>
  <div class="card mt3">${bar('Protein',t.p,g.p)}${bar('Kohlenhydrate',t.c,g.c)}${bar('Fett',t.f,g.f)}${bar('Kalorien',tk,gk,'kcal')}
    <div class="row between"><button class="btn ghost sm" data-a="goals">Ziele anpassen</button><button class="btn sm" data-a="daytype">${isT?'Trainingstag':'Ruhetag'} ⇄</button></div></div>
  ${weekly(g,gk)}
  <div class="card water"><span class="muted" style="min-width:60px">Wasser</span><div class="bar"><i class="water" style="width:${Math.min(100,ml/3000*100)}%"></i></div><span class="num tiny right" style="min-width:56px">${(ml/1000).toFixed(2).replace('.',',')} l</span><button class="btn sm" data-a="water" data-v="250">+250</button><button class="btn sm" data-a="water" data-v="500">+500</button><button class="btn ghost sm" data-a="water" data-v="-250">−</button></div>
  <div class="grid2 mb2"><button class="btn primary" data-a="scan">Scannen</button><button class="btn" data-a="search">Suchen</button><button class="btn" data-a="meals">Mahlzeit</button><button class="btn" data-a="new">Manuell</button></div>
  ${items.length?`<div class="card list">${items.map((i,idx)=>`<div class="item"><div class="grow"><div>${esc(i.n)||'<span class="tiny">Ohne Namen</span>'}${i.amount?` <span class="tiny">${i.amount} ${i.unit||'g'}</span>`:''}</div><div class="tiny num">P ${r1(i.p)} · C ${r1(i.c)} · F ${r1(i.f)} · ${kcalOf(i)} kcal</div></div><button class="btn ghost sm" data-a="rm" data-i="${idx}">✕</button></div>`).join('')}</div>`:'<div class="empty">Noch nichts eingetragen.</div>'}
  ${S.foods.length?`<h2>Zuletzt verwendet</h2><div class="card" id="recent">${recentFoods().slice(0,8).map(f=>foodRow(f).replace('data-x="pick"','data-a="pick"')).join('')}</div>`:''}`;
}
function goalsSheet(){
  const gr=S.goalsRest||S.goals,row=(pre,g)=>`<div class="grid3">${[['p','Protein'],['c','Carbs'],['f','Fett']].map(([k,l])=>`<div><label class="f">${l} (g)</label><input type="number" inputmode="numeric" id="${pre}${k}" value="${g[k]}"></div>`).join('')}</div>`;
  sheet(`<h3>Tagesziele</h3><div class="muted mb2">Trainingstag</div>${row('g',S.goals)}<div class="muted mt4 mb2">Ruhetag</div>${row('r',gr)}
  <div class="tiny mt2 mb4">Trainingstag wird automatisch erkannt, sobald ein Training gespeichert ist; oben lässt sich das pro Tag umschalten.</div>
  <div class="grid2"><button class="btn" data-x="close">Abbrechen</button><button class="btn primary" data-x="save">Speichern</button></div>`,{close:closeSheet,
    save:()=>{['p','c','f'].forEach(k=>S.goals[k]=+el('g'+k).value||0);S.goalsRest={};['p','c','f'].forEach(k=>S.goalsRest[k]=+el('r'+k).value||0);save();closeSheet();rerender()}});
}
export default{html,
  action(a,d){
    if(a==='day'){const dt=new Date(day+'T12:00');dt.setDate(dt.getDate()+ +d.o);day=dt.toISOString().slice(0,10);rerender()}
    if(a==='goals')goalsSheet();
    if(a==='daytype'){S.dayType[day]=!dayIsTrain(day);save();rerender()}
    if(a==='water'){S.water[day]=Math.max(0,(S.water[day]||0)+ +d.v);save();rerender()}
    if(a==='goalmode'){const m=['hold','gain','cut'];S.goalMode=m[(m.indexOf(S.goalMode||'hold')+1)%3];save();rerender();toast({hold:'Ziel: Halten',gain:'Ziel: Aufbau (+0,25 kg/Woche)',cut:'Ziel: Abnehmen (−0,4 kg/Woche)'}[S.goalMode])}
    if(a==='applykcal'){const v=+d.v;[S.goals,S.goalsRest].filter(Boolean).forEach(g=>{const cf=g.c*4+g.f*9;if(cf<=0)return;const k=(cf+v)/cf;g.c=Math.max(50,Math.round(g.c*k));g.f=Math.max(40,Math.round(g.f*k))});save();rerender();toast('Ziele angepasst – Protein bleibt')}
    if(a==='scan')scanSheet(day);if(a==='search')searchSheet(day);if(a==='new')foodForm(day,{});if(a==='meals')mealsSheet(day);
    if(a==='pick')amountSheet(day,S.foods.find(x=>x.id===d.id));
    if(a==='rm'){S.macros[day].splice(+d.i,1);save();rerender()}
  }};
