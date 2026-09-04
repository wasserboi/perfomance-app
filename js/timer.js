import {el} from './ui.js';
let tEnd=+localStorage.getItem('perf.tEnd')||0,tInt=null,beeped=false,actx=null;const tEl=el('timer');
function beep(){try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();if(actx.state==='suspended')actx.resume();[0,.18,.36].forEach(t=>{const o=actx.createOscillator(),g=actx.createGain();o.frequency.value=880;o.connect(g);g.connect(actx.destination);g.gain.setValueAtTime(.001,actx.currentTime+t);g.gain.exponentialRampToValueAtTime(.4,actx.currentTime+t+.02);g.gain.exponentialRampToValueAtTime(.001,actx.currentTime+t+.15);o.start(actx.currentTime+t);o.stop(actx.currentTime+t+.16)})}catch(e){}}
export function startTimer(sec){tEnd=Date.now()+sec*1000;localStorage.setItem('perf.tEnd',tEnd);beeped=false;tEl.classList.add('on');tEl.classList.remove('done');clearInterval(tInt);tInt=setInterval(tick,250);tick();try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();actx.resume()}catch(e){}}
function tick(){let s=Math.ceil((tEnd-Date.now())/1000);if(s<=0){s=0;if(!beeped){beeped=true;tEl.classList.add('done');if(navigator.vibrate)navigator.vibrate([200,100,200]);beep();setTimeout(stopTimer,Math.max(1500,4000+(tEnd-Date.now())))}clearInterval(tInt)}tEl.querySelector('.t').textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}
export function stopTimer(){clearInterval(tInt);tEnd=0;localStorage.removeItem('perf.tEnd');tEl.classList.remove('on','done')}
function resume(){if(!tEnd)return;if(Date.now()-tEnd>60000){stopTimer();return}tEl.classList.add('on');clearInterval(tInt);tInt=setInterval(tick,250);tick()}
tEl.onclick=e=>{const a=e.target.dataset.a;if(a==='stop')stopTimer();if(a==='plus'){tEnd+=15000;localStorage.setItem('perf.tEnd',tEnd);tick()}if(a==='minus'){tEnd-=15000;localStorage.setItem('perf.tEnd',tEnd);tick()}};
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')resume()});
resume();
