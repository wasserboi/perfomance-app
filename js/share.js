import {S,vol,totalKg,kcalOf,prWall,de,trend} from './state.js';
import {toast} from './ui.js';

function weekStats(){
  const mon=new Date();mon.setHours(0,0,0,0);mon.setDate(mon.getDate()-((mon.getDay()+6)%7));
  const wk=S.workouts.filter(w=>new Date(w.date)>=mon);
  const tonnage=wk.reduce((a,w)=>a+vol(w),0);
  const prs=prWall().filter(e=>new Date(e.date)>=mon).length;
  const days=[...Array(7)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()-i);return d.toISOString().slice(0,10)}).filter(d=>(S.macros[d]||[]).length);
  const avgKcal=days.length?Math.round(days.reduce((a,d)=>a+S.macros[d].reduce((b,i)=>b+kcalOf(i),0),0)/days.length):null;
  const ws=[...S.weights].sort((a,b)=>a.d<b.d?-1:1);const tr=trend(ws.slice(-30));const last=tr[tr.length-1],prev=tr[tr.length-8];
  const dw=last&&prev?last.y-prev.y:null;
  return{days:wk.length,tonnage,prs,avgKcal,dw,weight:ws[ws.length-1],mon};
}

function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}

export async function buildWeekImage(){
  const s=weekStats();
  const W=1080,H=1350,cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d');
  const bg=c.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#1c2026');bg.addColorStop(1,'#12151a');
  c.fillStyle=bg;c.fillRect(0,0,W,H);
  c.fillStyle='#3f6fe8';c.fillRect(0,0,W,14);
  c.fillStyle='#eef0f3';c.font='700 64px system-ui,-apple-system,Helvetica,Arial';c.fillText('Trainingswoche',72,150);
  c.fillStyle='#a4acb8';c.font='400 34px system-ui,-apple-system,Helvetica,Arial';
  const range=s.mon.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'})+' – '+new Date().toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'});
  c.fillText(range,72,200);

  const stats=[['Einheiten',String(s.days)],['Tonnen bewegt',de(s.tonnage/1000,{maximumFractionDigits:1})],['Neue Bestleistungen',String(s.prs)]];
  let y=290;
  stats.forEach(([label,val])=>{
    c.fillStyle='#242930';rr(c,72,y,W-144,150,24);c.fill();
    c.fillStyle='#a4acb8';c.font='400 32px system-ui,-apple-system,Helvetica,Arial';c.fillText(label,110,y+55);
    c.fillStyle='#eef0f3';c.font='700 76px system-ui,-apple-system,Helvetica,Arial';c.fillText(val,110,y+125);
    y+=175;
  });
  if(s.avgKcal){
    c.fillStyle='#242930';rr(c,72,y,W-144,150,24);c.fill();
    c.fillStyle='#a4acb8';c.font='400 32px system-ui,-apple-system,Helvetica,Arial';c.fillText('Ø Kalorien / Tag',110,y+55);
    c.fillStyle='#eef0f3';c.font='700 76px system-ui,-apple-system,Helvetica,Arial';c.fillText(String(s.avgKcal)+' kcal',110,y+125);
    y+=175;
  }
  if(s.weight){
    c.fillStyle='#242930';rr(c,72,y,W-144,150,24);c.fill();
    c.fillStyle='#a4acb8';c.font='400 32px system-ui,-apple-system,Helvetica,Arial';c.fillText('Gewicht',110,y+55);
    c.fillStyle='#eef0f3';c.font='700 76px system-ui,-apple-system,Helvetica,Arial';c.fillText(s.weight.w.toFixed(1)+' kg',110,y+125);
    if(s.dw!==null){c.fillStyle=Math.abs(s.dw)<0.3?'#a4acb8':s.dw>0?'#e8a33f':'#3ec585';c.font='600 40px system-ui,-apple-system,Helvetica,Arial';
      c.fillText((s.dw>0?'+':'')+s.dw.toFixed(1)+' kg',W-320,y+95);}
    y+=175;
  }
  c.fillStyle='#6f7885';c.font='400 26px system-ui,-apple-system,Helvetica,Arial';c.fillText('Performance',72,H-60);

  return new Promise(res=>cv.toBlob(b=>res(b),'image/png',0.95));
}

export async function shareWeekImage(){
  toast('Bild wird erstellt…');
  const blob=await buildWeekImage();
  const file=new File([blob],'trainingswoche.png',{type:'image/png'});
  if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){
    try{await navigator.share({files:[file],title:'Trainingswoche'});return}catch(e){if(e.name==='AbortError')return}
  }
  const u=URL.createObjectURL(blob),l=document.createElement('a');l.href=u;l.download='trainingswoche.png';document.body.appendChild(l);l.click();setTimeout(()=>{l.remove();URL.revokeObjectURL(u)},2000);
  toast('Bild gespeichert');
}
