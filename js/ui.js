import {today} from './state.js';

export const $=(sel,root=document)=>root.querySelector(sel);
export const $$=(sel,root=document)=>[...root.querySelectorAll(sel)];
export const el=id=>document.getElementById(id);

// ----- Toast -----
let toastT=null;
export function toast(m){const t=el('toast');t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),1600)}

// ----- Sheet -----
let onClose=null;
export function sheet(html,handlers={}){
  const box=$('#sheet .in');box.innerHTML='<div class="grab"></div>'+html;el('sheet').classList.add('on');
  box.onclick=ev=>{const b=ev.target.closest('[data-x]');if(!b)return;const fn=handlers[b.dataset.x];if(fn)fn(b,ev)};
  box.oninput=handlers._input||null;box.onchange=handlers._change||null;onClose=handlers._close||null;
  return box;
}
export function closeSheet(){el('sheet').classList.remove('on');if(onClose){const f=onClose;onClose=null;f()}}
el('sheet').addEventListener('click',e=>{if(e.target.id==='sheet')closeSheet()});
export function prompt2(title,cb,ph='',val=''){
  sheet(`<h3>${title}</h3><input id="pv" placeholder="${ph}" value="${val}" class="mb3"><div class="grid2"><button class="btn" data-x="close">Abbrechen</button><button class="btn primary" data-x="ok">OK</button></div>`,
    {close:closeSheet,ok:()=>{const v=el('pv').value.trim();closeSheet();cb(v)}});
  const inp=el('pv');setTimeout(()=>inp.focus(),50);inp.onkeydown=e=>{if(e.key==='Enter'){const v=inp.value.trim();closeSheet();cb(v)}};
}
export const confirm2=m=>window.confirm(m);

// ----- Downloads -----
export function dl(name,content,type){const bl=new Blob([type.includes('csv')?'\ufeff'+content:content],{type}),u=URL.createObjectURL(bl),l=document.createElement('a');l.href=u;l.download=name;document.body.appendChild(l);l.click();setTimeout(()=>{l.remove();URL.revokeObjectURL(u)},2000)}
export const csv=rows=>rows.map(r=>r.map(v=>{v=String(v??'');return /[;"\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}).join(';')).join('\n');

// ----- Tabs & rendering -----
const views={};let tab='log';
export function registerView(name,view){views[name]=view}
export function currentTab(){return tab}
export function setTab(name){tab=name;render(true)}
export function render(top=false){
  const y=window.scrollY;
  $$('nav button').forEach(b=>b.classList.toggle('on',b.dataset.tab===tab));
  const app=el('app');const v=views[tab];app.innerHTML=v.html();if(v.after)v.after(app);
  app.onclick=e=>{const b=e.target.closest('[data-a]');if(b&&v.action)v.action(b.dataset.a,b.dataset,b,e)};
  app.oninput=e=>{if(v.input)v.input(e.target,e)};
  app.onchange=e=>{if(v.change)v.change(e.target,e)};
  window.scrollTo(0,top?0:y);
}
export function rerender(){render(false)}
$('nav').onclick=e=>{const b=e.target.closest('button');if(b)setTab(b.dataset.tab)};

export const svgCheck='<svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg>';
