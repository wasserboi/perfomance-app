// ===== Konstanten =====
export const APP_VERSION='27';
export const KEY='perf.v1';
export const STAGES=[{sets:10,reps:3},{sets:7,reps:5},{sets:5,reps:7}];
export const TYPES=['Freihand','Maschine','Kabelturm'];
export const MEAS=[['waist','Bauch'],['chest','Brust'],['armL','Arm links'],['armR','Arm rechts'],['thighL','Bein links'],['thighR','Bein rechts']];
export const stageLabel=st=>STAGES[st].sets+'×'+STAGES[st].reps;

const def={plans:[],workouts:[],weights:[],macros:{},foods:[],meals:[],measures:[],exNotes:{},dayType:{},
  goals:{p:180,c:250,f:80},goalsRest:null,goalMode:'hold',water:{},photosDeleted:[],supps:[],checks:{},waterGoal:3000,settings:{rest:90,overload:2.5},active:null};

// ===== State =====
export const clone=o=>JSON.parse(JSON.stringify(o));
export let S=load();
function load(){try{const s=JSON.parse(localStorage.getItem(KEY));return s?Object.assign(clone(def),s):clone(def)}catch(e){return clone(def)}}
export function replaceState(data){S=Object.assign(clone(def),data);localStorage.setItem(KEY,JSON.stringify(S));emit('replace')}

const listeners={};
export function on(ev,fn){(listeners[ev]=listeners[ev]||[]).push(fn)}
export function emit(ev,arg){(listeners[ev]||[]).forEach(f=>f(arg))}
export function save(){S.updatedAt=Date.now();localStorage.setItem(KEY,JSON.stringify(S));emit('save')}

// ===== Helpers =====
export const uid=()=>Math.random().toString(36).slice(2,9);
export const today=()=>new Date().toISOString().slice(0,10);
export const fmtD=d=>new Date(d+(d.length===10?'T12:00':'')).toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'});
export const fmtDL=d=>new Date(d).toLocaleDateString('de-DE',{weekday:'short',day:'2-digit',month:'2-digit'});
export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const e1rm=(w,r)=>r>0?w*(1+r/30):0;
export const r1=v=>Math.round(v*10)/10;
export const pctS=v=>(v>=0?'+':'')+v.toFixed(1).replace('.',',')+' %';
export const pctC=v=>v>0.05?'good':v<-0.05?'bad':'muted';
export const de=(n,opt)=>Number(n).toLocaleString('de-DE',opt);

// ===== Training-Logik =====
export const work=e=>e.sets.filter(s=>!s.wu);
export const vol=w=>w.exercises.reduce((a,e)=>a+e.sets.filter(s=>s.done&&!s.wu).reduce((b,s)=>b+s.w*s.r,0),0);
export const totalKg=()=>S.workouts.reduce((a,w)=>a+vol(w),0);
export const bestRm=e=>work(e).reduce((a,s)=>Math.max(a,e1rm(s.w,s.r)),0);
export const planWorkouts=(planId,name)=>S.workouts.filter(w=>planId?w.planId===planId:w.name===name);

export function lastSets(name){
  for(let i=S.workouts.length-1;i>=0;i--){const ex=S.workouts[i].exercises.find(x=>x.name===name);if(ex){const d=ex.sets.filter(s=>s.done&&s.w>0&&!s.wu);if(d.length)return d}}
  return null;
}
export function compare(w,ref){
  if(!ref)return null;
  const common=w.exercises.filter(e=>ref.exercises.some(x=>x.name===e.name));
  if(!common.length)return null;
  const ref_=n=>ref.exercises.find(x=>x.name===n);
  const cur=common.reduce((a,e)=>a+bestRm(e),0),old=common.reduce((a,e)=>a+bestRm(ref_(e.name)),0);
  const cv=common.reduce((a,e)=>a+work(e).reduce((b,s)=>b+s.w*s.r,0),0),ov=common.reduce((a,e)=>a+work(ref_(e.name)).reduce((b,s)=>b+s.w*s.r,0),0);
  return{pct:old?(cur/old-1)*100:0,vol:ov?(cv/ov-1)*100:0,date:ref.date,n:common.length,
    per:common.map(e=>{const o=bestRm(ref_(e.name)),c=bestRm(e);return{name:e.name,pct:o?(c/o-1)*100:0}})};
}
export function prsFor(w){
  const before=S.workouts.filter(x=>x.date<w.date);const out={};let n=0;
  w.exercises.forEach(e=>{const hist=[];before.forEach(x=>{const h=x.exercises.find(y=>y.name===e.name);if(h)hist.push(...work(h))});
    const bw=Math.max(0,...hist.map(s=>s.w)),brm=Math.max(0,...hist.map(s=>e1rm(s.w,s.r))),bv=Math.max(0,...hist.map(s=>s.w*s.r));
    const ws=work(e);if(!ws.length)return;const cw=Math.max(...ws.map(s=>s.w)),crm=Math.max(...ws.map(s=>e1rm(s.w,s.r))),cv=Math.max(...ws.map(s=>s.w*s.r));
    const p=[];if(hist.length&&cw>bw)p.push('Gewicht');if(hist.length&&crm>brm+0.5)p.push('1RM');if(hist.length&&cv>bv)p.push('Volumen');
    if(p.length){out[e.name]=p;n+=p.length}});
  return{per:out,n};
}
export function allTimeBest(name){let bw=0,brm=0;S.workouts.forEach(x=>{const h=x.exercises.find(y=>y.name===name);if(h)work(h).forEach(t=>{bw=Math.max(bw,t.w);brm=Math.max(brm,e1rm(t.w,t.r))})});return{bw,brm}}
export function allExercises(){const m={};S.workouts.forEach(w=>w.exercises.forEach(e=>m[e.name]=w.date));return Object.keys(m).sort((a,b)=>m[b]<m[a]?-1:1)}
export function recentExercises(n=6){const seen=[];for(let i=S.workouts.length-1;i>=0&&seen.length<n;i--)S.workouts[i].exercises.forEach(e=>{if(!seen.includes(e.name))seen.push(e.name)});return seen}
export function exHistory(name){return S.workouts.map(w=>{const e=w.exercises.find(x=>x.name===name);if(!e)return null;const ws=work(e);if(!ws.length)return null;const best=ws.reduce((a,s)=>e1rm(s.w,s.r)>e1rm(a.w,a.r)?s:a,ws[0]);return{d:w.date,w:best.w,r:best.r,rm:e1rm(best.w,best.r),vol:ws.reduce((a,s)=>a+s.w*s.r,0)}}).filter(x=>x&&x.rm>0)}

export function renameExercise(from,to){if(!to||from===to)return;
  S.workouts.forEach(w=>{const a=w.exercises.find(e=>e.name===to),b=w.exercises.find(e=>e.name===from);if(b){if(a){a.sets=a.sets.concat(b.sets);w.exercises=w.exercises.filter(e=>e!==b)}else b.name=to}});
  S.plans.forEach(p=>p.exercises.forEach(e=>{if(e.name===from)e.name=to}));
  if(S.active)S.active.exercises.forEach(e=>{if(e.name===from)e.name=to});
  if(S.exNotes[from]){S.exNotes[to]=S.exNotes[to]||S.exNotes[from];delete S.exNotes[from]}
  save();
}

// ===== Workout starten / beenden =====
export function startWorkout(planId){
  const p=S.plans.find(x=>x.id===planId);let exercises=[];
  if(p){
    const last=planWorkouts(p.id,p.name).slice(-1)[0],step=S.settings.overload||2.5;
    const mainEx=e=>{const st=e.state||{weight:e.weight,stage:0},cfg=STAGES[st.stage];return{name:e.name,type:e.type,main:true,stage:st.stage,targetReps:cfg.reps,sets:Array.from({length:cfg.sets},()=>({w:st.weight,r:cfg.reps,done:false}))}};
    if(last)exercises=last.exercises.map(e=>{const pe=p.exercises.find(x=>x.name===e.name);if(pe?.main)return mainEx(pe);const target=pe?.reps||e.targetReps||0;const ws=e.sets.filter(x=>!x.wu);
      const hit=target&&ws.length&&ws.every(x=>x.r>=target)&&ws.some(x=>x.w>0);
      return{name:e.name,type:pe?.type||e.type,targetReps:target||undefined,sug:hit?step:0,sets:e.sets.map(x=>({w:hit&&!x.wu?Math.round((x.w+step)*2)/2:x.w,r:x.r,done:false,wu:!!x.wu}))}});
    p.exercises.forEach(e=>{if(!exercises.some(x=>x.name===e.name))exercises.push(e.main?mainEx(e):{name:e.name,type:e.type,targetReps:e.reps,sets:Array.from({length:e.sets||3},()=>({w:0,r:0,done:false}))})});
    const mi=exercises.findIndex(e=>e.main);if(mi>0){const [m]=exercises.splice(mi,1);exercises.unshift(m)}
  }
  S.active={id:uid(),name:p?p.name:'Freies Training',planId:planId||null,start:Date.now(),basedOn:!!(p&&exercises.length&&exercises[0].sets[0].w),exercises};
  save();
}
export function finishWorkout(){
  const a=S.active;const exercises=a.exercises.map(e=>({name:e.name,type:e.type,main:e.main,stage:e.stage,targetReps:e.targetReps,sets:e.sets.filter(s=>s.done)})).filter(e=>e.sets.some(s=>!s.wu));
  if(!exercises.length)return null;
  let mainRes=null;const p=S.plans.find(x=>x.id===a.planId),me=exercises.find(e=>e.main),pe=p&&me&&p.exercises.find(x=>x.name===me.name&&x.main);
  if(pe){const st=pe.state||{weight:pe.weight,stage:0},cfg=STAGES[st.stage],ws=me.sets.filter(x=>!x.wu);
    const ok=ws.length>=cfg.sets&&ws.slice(0,cfg.sets).every(x=>x.r>=cfg.reps&&x.w>=st.weight);
    let next,deload=false;
    if(ok)next={weight:st.weight,stage:st.stage<2?st.stage+1:0,fails:0};
    else if((st.fails||0)+1>=2){deload=true;next={weight:Math.max(20,st.weight-Math.max(5,(pe.step||10)/2)),stage:0,fails:0}}
    else next={weight:st.weight,stage:st.stage,fails:(st.fails||0)+1};
    if(ok&&st.stage===2)next.weight=st.weight+(pe.step||10);
    mainRes={name:me.name,ok,deload,from:st,to:next,done:ws.filter(x=>x.r>=cfg.reps&&x.w>=st.weight).length,need:cfg.sets};pe.state=next;}
  const w={id:a.id,name:a.name,planId:a.planId,date:new Date().toISOString(),duration:(Date.now()-a.start)/1000,exercises,mainRes};
  S.workouts.push(w);S.active=null;save();return w;
}

// ===== Ernährung =====
export const fkcal=f=>f.kcal||Math.round(f.p*4+f.c*4+f.f*9);
export const kcalOf=o=>o.kcal||Math.round(o.p*4+o.c*4+o.f*9);
export function dayIsTrain(d){if(S.dayType[d]!==undefined)return S.dayType[d];return S.workouts.some(w=>w.date.slice(0,10)===d)||(S.active&&d===today())}
export const SLOTS=[['morning','Morgens'],['noon','Mittags'],['evening','Abends'],['night','Vor dem Schlafen']];
export const slotLabel=k=>(SLOTS.find(s=>s[0]===k)||[,''])[1];
export function suppDue(sp,d){if(sp.paused)return false;if(!sp.days||sp.days==='daily')return true;const wd=['SU','MO','TU','WE','TH','FR','SA'][new Date(d+'T12:00').getDay()];return sp.days.includes(wd)}
// Status: true = erledigt, 'x' = nicht gemacht, undefined = offen
export function checkState(d,id){const v=(S.checks[d]||{})[id];return v===true?'done':v==='x'?'miss':'open'}
export function isChecked(d,id){return checkState(d,id)==='done'}
export function cycleCheck(d,id){const cur=checkState(d,id),next=cur==='open'?true:cur==='done'?'x':null;const c=S.checks[d]=S.checks[d]||{};
  if(next===null)delete c[id];else c[id]=next;if(!Object.keys(c).length)delete S.checks[d];save();return checkState(d,id)}
export function setCheck(d,id,v){const c=S.checks[d]=S.checks[d]||{};if(v)c[id]=v===true?true:v;else delete c[id];if(!Object.keys(c).length)delete S.checks[d];save()}
// Historie einer Aufgabe: letzte n Tage, nur an fälligen Tagen
export function habit(id,n=14,dueFn){const out=[];const t=new Date();t.setHours(12,0,0,0);
  for(let i=n-1;i>=0;i--){const x=new Date(t);x.setDate(t.getDate()-i);const d=x.toISOString().slice(0,10);
    out.push({d,due:dueFn?dueFn(d):true,st:checkState(d,id)})}
  const due=out.filter(o=>o.due),done=due.filter(o=>o.st==='done').length;
  let streak=0;for(let i=due.length-1;i>=0;i--){if(due[i].st==='done')streak++;else if(due[i].st==='open'&&i===due.length-1)continue;else break}
  return{days:out,rate:due.length?Math.round(done/due.length*100):0,streak,done,total:due.length}}
export const MIN=['mg','ca','na'];// Magnesium, Calcium, Natrium in mg pro 100 ml/g
export function bookFood(day,f,amt,asWater){const i=S.foods.findIndex(x=>x.id===f.id);f.used=Date.now();i<0?S.foods.push(f):S.foods[i]=f;
  const e={n:f.name,foodId:f.id,amount:amt,unit:f.unit||'g',p:r1(f.p*amt/100),c:r1(f.c*amt/100),f:r1(f.f*amt/100),kcal:Math.round(fkcal(f)*amt/100)};
  MIN.forEach(k=>{if(f[k])e[k]=Math.round(f[k]*amt/100)});
  if(asWater){e.water=amt;S.water[day]=(S.water[day]||0)+amt}
  (S.macros[day]=S.macros[day]||[]).push(e);save()}
export const isDrink=f=>(f.unit==='ml')&&fkcal(f)<=5;
export function dayMinerals(day){return (S.macros[day]||[]).reduce((a,i)=>{MIN.forEach(k=>a[k]=(a[k]||0)+(i[k]||0));return a},{})}
export const recentFoods=()=>[...S.foods].sort((a,b)=>(b.used||0)-(a.used||0));
export function trend(ws,k=0.3){let e=null;return ws.map(x=>{e=e===null?x.w:e+k*(x.w-e);return{d:x.d,y:Math.round(e*100)/100}})}
