import {S,save,today,fmtD,esc,de,vol,SLOTS,slotLabel,suppDue,isChecked,setCheck,dayIsTrain,kcalOf,planWorkouts,uid,clone,trend} from '../state.js';
import {sheet,closeSheet,toast,rerender,setTab,el,confirm2} from '../ui.js';

const WD=[['MO','Mo'],['TU','Di'],['WE','Mi'],['TH','Do'],['FR','Fr'],['SA','Sa'],['SU','So']];

function tasks(d){
  const list=[];
  const w=S.weights.find(x=>x.d===d);
  list.push({id:'weight',slot:'morning',t:'Gewicht messen',sub:'Nach dem Aufstehen, nach der Toilette',done:!!w,val:w?w.w.toFixed(1)+' kg':'',act:'weight'});
  S.supps.filter(sp=>suppDue(sp,d)).forEach(sp=>list.push({id:sp.id,slot:sp.slot,t:sp.name,sub:sp.dose||'',done:isChecked(d,sp.id),supp:true}));
  return list;
}
function kpis(d){
  const items=S.macros[d]||[],prot=items.reduce((a,i)=>a+i.p,0),kcal=items.reduce((a,i)=>a+kcalOf(i),0);
  const g=dayIsTrain(d)?S.goals:(S.goalsRest||S.goals);
  const ml=S.water[d]||0,wg=S.waterGoal||3000;
  const mon=new Date();mon.setHours(0,0,0,0);mon.setDate(mon.getDate()-((mon.getDay()+6)%7));const wk=S.workouts.filter(x=>new Date(x.date)>=mon);
  const ws=[...S.weights].sort((a,b)=>a.d<b.d?-1:1),tr=trend(ws.slice(-30)),last=tr[tr.length-1],prev=tr[tr.length-8];
  return {prot,pg:g.p,kcal,kg:kcalOf(g),ml,wg,wk,weight:ws[ws.length-1],dw:last&&prev?last.y-prev.y:null};
}
function ring(v,g,label,unit,cls){const pct=Math.min(100,g?v/g*100:0);
  return `<div class="kpi"><div class="row between"><span class="tiny">${label}</span><span class="tiny num">${Math.round(pct)} %</span></div><div class="big num">${Math.round(v)}<span class="tiny"> / ${g} ${unit}</span></div><div class="bar"><i class="${cls}" style="width:${pct}%"></i></div></div>`}

function html(){
  const d=today(),k=kpis(d),ts=tasks(d),open=ts.filter(t=>!t.done).length;
  const due=S.plans.map(p=>({p,last:planWorkouts(p.id,p.name).slice(-1)[0]})).sort((a,b)=>(a.last?a.last.date:'')<(b.last?b.last.date:'')?-1:1)[0];
  const trainedToday=S.workouts.some(w=>w.date.slice(0,10)===d);
  return `<h1>Heute<small>${new Date().toLocaleDateString('de-DE',{weekday:'long',day:'numeric',month:'long'})}${open?` · ${open} offen`:' · alles erledigt'}</small></h1>

  <div class="grid2">${ring(k.prot,k.pg,'Protein','g','p')}${ring(k.kcal,k.kg,'Kalorien','kcal','k')}${ring(k.ml/1000,k.wg/1000,'Wasser','l','water')}
    <div class="kpi"><div class="row between"><span class="tiny">Gewicht</span><span class="tiny num ${k.dw===null?'':k.dw>0.1?'warn':k.dw<-0.1?'good':''}">${k.dw===null?'':(k.dw>0?'+':'')+k.dw.toFixed(1)+' kg'}</span></div><div class="big num">${k.weight?k.weight.w.toFixed(1):'–'}<span class="tiny"> kg</span></div><div class="tiny">${k.weight?fmtD(k.weight.d):'noch kein Eintrag'} · Trend 7 Tage</div></div>
  </div>

  <h2>Training</h2>
  <div class="card">
    ${trainedToday?'<div class="row between"><span class="good" style="font-weight:600">Heute schon trainiert</span><span class="tiny num">'+de(S.workouts.filter(w=>w.date.slice(0,10)===d).reduce((a,w)=>a+vol(w),0))+' kg</span></div>'
     :due?`<div class="row between"><div><div style="font-weight:600">${esc(due.p.name)}</div><div class="tiny">${due.last?'zuletzt '+fmtD(due.last.date):'noch nie'} · ${k.wk.length} Einheit${k.wk.length===1?'':'en'} diese Woche</div></div><button class="btn primary sm" data-a="start" data-id="${due.p.id}">Starten</button></div>`
     :'<div class="muted">Noch kein Plan angelegt.</div>'}
  </div>

  <h2>Tagesplan</h2>
  ${SLOTS.map(([key,label])=>{const l=ts.filter(t=>t.slot===key);if(!l.length)return'';
    return `<div class="card"><div class="tiny mb2">${label}</div><div class="list">${l.map(t=>`<div class="item"><button class="tick ${t.done?'done':''}" data-a="tick" data-id="${t.id}" data-act="${t.act||''}"></button><div class="grow"><div class="${t.done?'strike':''}">${esc(t.t)}</div>${t.sub?`<div class="tiny">${esc(t.sub)}</div>`:''}</div>${t.val?`<span class="tiny num">${t.val}</span>`:''}</div>`).join('')}</div></div>`}).join('')}
  <button class="btn wide" data-a="supps">Supplements verwalten</button>`;
}

function suppSheet(id){
  const sp=id?clone(S.supps.find(x=>x.id===id)):{id:uid(),name:'',dose:'',slot:'morning',days:'daily'};
  const draw=()=>sheet(`<h3>${id?'Supplement':'Neues Supplement'}</h3>
    <div class="field"><label class="f">Name</label><input id="spn" value="${esc(sp.name)}" placeholder="z. B. Omega 3"></div>
    <div class="field"><label class="f">Dosis (optional)</label><input id="spd" value="${esc(sp.dose||'')}" placeholder="z. B. 2 Kapseln / 2000 IE"></div>
    <div class="field"><label class="f">Zeitpunkt</label><select id="sps">${SLOTS.map(([k,l])=>`<option value="${k}" ${sp.slot===k?'selected':''}>${l}</option>`).join('')}</select></div>
    <label class="f">Rhythmus</label>
    <div class="mb2"><button class="chip ${sp.days==='daily'?'on':''}" data-x="daily">Täglich</button><button class="chip ${sp.days!=='daily'?'on':''}" data-x="custom">Bestimmte Tage</button></div>
    ${sp.days!=='daily'?`<div class="mb3">${WD.map(([k,l])=>`<button class="chip ${(sp.days||[]).includes(k)?'on':''}" data-x="wd" data-k="${k}">${l}</button>`).join('')}</div>`:''}
    <div class="grid2 mt3"><button class="btn" data-x="close">Abbrechen</button><button class="btn primary" data-x="save">Speichern</button></div>
    ${id?'<button class="btn ghost danger wide mt2" data-x="del">Löschen</button>':''}`,{
    _input:ev=>{if(ev.target.id==='spn')sp.name=ev.target.value;if(ev.target.id==='spd')sp.dose=ev.target.value},
    _change:ev=>{if(ev.target.id==='sps')sp.slot=ev.target.value},
    daily:()=>{sp.days='daily';draw()},custom:()=>{if(sp.days==='daily')sp.days=['MO','TU','WE','TH','FR','SA','SU'];draw()},
    wd:b=>{const k=b.dataset.k;sp.days=(sp.days||[]).includes(k)?sp.days.filter(x=>x!==k):[...sp.days,k];draw()},
    close:()=>suppsSheet(),del:()=>{if(!confirm2('Löschen?'))return;S.supps=S.supps.filter(x=>x.id!==id);save();suppsSheet();rerender()},
    save:()=>{sp.name=el('spn').value.trim();sp.dose=el('spd').value.trim();sp.slot=el('sps').value;if(!sp.name){toast('Name fehlt');return}
      const i=S.supps.findIndex(x=>x.id===sp.id);i<0?S.supps.push(sp):S.supps[i]=sp;save();suppsSheet();rerender()}});
  draw();
}
function suppsSheet(){
  sheet(`<h3>Supplements</h3>
    ${S.supps.length?`<div class="list mb3">${S.supps.map(sp=>`<button class="item" data-x="edit" data-id="${sp.id}" style="width:100%;text-align:left"><div class="grow"><div style="font-weight:600">${esc(sp.name)}${sp.paused?' <span class="tag">pausiert</span>':''}</div><div class="tiny">${slotLabel(sp.slot)}${sp.dose?' · '+esc(sp.dose):''}${sp.days==='daily'?'':' · '+(sp.days||[]).map(k=>(WD.find(w=>w[0]===k)||[,''])[1]).join(', ')}</div></div><span class="tiny">bearbeiten ›</span></button>`).join('')}</div>`
      :'<div class="muted mb3">Noch keine Supplements. Lege z. B. Omega 3, Vitamin D3+K2, Magnesium und Zink an.</div>'}
    <button class="btn primary wide" data-x="new">+ Supplement</button>
    ${S.supps.length?'':'<button class="btn wide mt2" data-x="preset">Standard-Stack übernehmen</button>'}
    <button class="btn wide mt2" data-x="close">Schließen</button>`,{
    close:closeSheet,new:()=>suppSheet(),edit:b=>suppSheet(b.dataset.id),
    preset:()=>{[['Omega 3','2 Kapseln','noon'],['Vitamin D3 + K2','','noon'],['Magnesium','','evening'],['Zink','','night']].forEach(([n,dz,sl])=>S.supps.push({id:uid(),name:n,dose:dz,slot:sl,days:'daily'}));save();suppsSheet();rerender()}});
}

export default{html,
  action(a,d){
    const day=today();
    if(a==='tick'){
      if(d.act==='weight'){setTab('body');return}
      setCheck(day,d.id,!isChecked(day,d.id));if(navigator.vibrate)navigator.vibrate(20);rerender()}
    if(a==='supps')suppsSheet();
    if(a==='start'){import('../state.js').then(m=>{m.startWorkout(d.id);setTab('log')})}
  }};
