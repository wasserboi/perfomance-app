// Geglättete Linie mit Verlauf; pts=[{d,y}], raw=optional Punkte
export function lineChart(cv,pts,raw,unit=''){
  if(!cv)return;const dpr=devicePixelRatio||1,W=cv.clientWidth||340,H=190;cv.width=W*dpr;cv.height=H*dpr;const c=cv.getContext('2d');c.scale(dpr,dpr);
  const cs=getComputedStyle(document.body),acc=cs.getPropertyValue('--accent2').trim()||'#5d86ef',ink3=cs.getPropertyValue('--ink3').trim()||'#6f7885',ink2=cs.getPropertyValue('--ink2').trim()||'#a4acb8';
  if(pts.length<1){c.fillStyle=ink3;c.font='14px -apple-system,sans-serif';c.fillText('Noch keine Daten',10,30);return}
  const L=34,R=54,T=16,B=24,ys=pts.map(p=>p.y).concat((raw||[]).map(p=>p.y));
  let lo=Math.min(...ys),hi=Math.max(...ys);if(hi===lo){hi+=5;lo-=5}const pad=(hi-lo)*.18;lo=Math.max(0,lo-pad);hi+=pad;
  const t0=new Date(pts[0].d).getTime(),t1=new Date(pts[pts.length-1].d).getTime(),span=Math.max(1,t1-t0);
  const X=d=>L+(W-L-R)*((new Date(d).getTime()-t0)/span),Y=v=>T+(H-T-B)*(1-(v-lo)/(hi-lo));
  c.font='11px -apple-system,sans-serif';c.fillStyle=ink3;c.textAlign='right';c.strokeStyle='rgba(255,255,255,.07)';c.lineWidth=1;
  for(let k=0;k<=2;k++){const v=lo+(hi-lo)*k/2,y=Y(v);c.beginPath();c.moveTo(L,y);c.lineTo(W-R,y);c.stroke();c.fillText(Math.round(v),L-6,y+4)}
  c.textAlign='center';const n=4;for(let k=0;k<=n;k++){const t=t0+span*k/n;c.fillText(new Date(t).toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'}),L+(W-L-R)*k/n,H-7)}
  const P=pts.map(p=>[X(p.d),Y(p.y)]);
  const path=()=>{c.beginPath();c.moveTo(P[0][0],P[0][1]);for(let i=0;i<P.length-1;i++){const p0=P[i-1]||P[i],p1=P[i],p2=P[i+1],p3=P[i+2]||p2;c.bezierCurveTo(p1[0]+(p2[0]-p0[0])/6,p1[1]+(p2[1]-p0[1])/6,p2[0]-(p3[0]-p1[0])/6,p2[1]-(p3[1]-p1[1])/6,p2[0],p2[1])}};
  if(P.length>1){path();c.lineTo(P[P.length-1][0],H-B);c.lineTo(P[0][0],H-B);c.closePath();const g=c.createLinearGradient(0,T,0,H-B);g.addColorStop(0,'rgba(93,134,239,.35)');g.addColorStop(1,'rgba(93,134,239,0)');c.fillStyle=g;c.fill()}
  if(raw){c.fillStyle='rgba(164,172,184,.35)';raw.forEach(p=>{c.beginPath();c.arc(X(p.d),Y(p.y),2,0,7);c.fill()})}
  if(P.length>1){path();c.strokeStyle=acc;c.lineWidth=2.5;c.lineJoin='round';c.lineCap='round';c.stroke()}
  const e=P[P.length-1];c.fillStyle=acc;c.beginPath();c.arc(e[0],e[1],4,0,7);c.fill();c.strokeStyle='#1c2026';c.lineWidth=2;c.stroke();
  c.fillStyle=ink2;c.font='600 12px -apple-system,sans-serif';c.textAlign='left';c.fillText((Math.round(pts[pts.length-1].y*10)/10).toLocaleString('de-DE')+unit,e[0]+8,e[1]+4);
}
