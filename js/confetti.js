// Kurzer Konfetti-Effekt bei einem PR. Reines DOM/CSS, kein Canvas nötig für diese Größenordnung.
const COLORS=['#3f6fe8','#5d86ef','#3ec585','#e8a33f','#c06fe8'];
export function burst(){
  const box=document.createElement('div');box.className='confetti-box';
  for(let i=0;i<26;i++){
    const p=document.createElement('i');
    const x=(Math.random()-.5)*280,rot=(Math.random()-.5)*720,dur=600+Math.random()*500,delay=Math.random()*80;
    p.style.cssText=`--x:${x}px;--r:${rot}deg;--c:${COLORS[i%COLORS.length]};animation-duration:${dur}ms;animation-delay:${delay}ms`;
    box.appendChild(p);
  }
  document.body.appendChild(box);
  setTimeout(()=>box.remove(),1400);
}
