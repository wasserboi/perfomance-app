import {esc} from './state.js';
import {sheet,closeSheet,toast,el} from './ui.js';
import {search,autoMatch,imgUrl} from './exercisedb.js';

const ATTR='Übungsdaten von <a href="https://repdb.co" target="_blank" rel="noopener" style="color:var(--accent2)">RepDB (repdb.co)</a>';
const MUSCLE_DE={pectoralis_major:'Brust',anterior_deltoid:'vordere Schulter',lateral_deltoid:'seitliche Schulter',posterior_deltoid:'hintere Schulter',
  latissimus_dorsi:'breiter Rücken',trapezius:'Trapez',rhomboids:'Rautenmuskel',erector_spinae:'Rückenstrecker',
  biceps_brachii:'Bizeps',triceps_brachii:'Trizeps',forearm_flexors:'Unterarm',
  rectus_abdominis:'gerader Bauchmuskel',obliques:'seitliche Bauchmuskeln',transverse_abdominis:'querer Bauchmuskel',
  quadriceps:'Quadrizeps',hamstrings:'hintere Oberschenkel',gluteus_maximus:'großer Gesäßmuskel',gluteus_medius:'mittlerer Gesäßmuskel',
  adductors:'Adduktoren',abductors:'Abduktoren',gastrocnemius:'Wade',soleus:'Wade (Soleus)',hip_flexors:'Hüftbeuger',serratus_anterior:'vorderer Sägemuskel'};
const musc=k=>MUSCLE_DE[k]||k?.replace(/_/g,' ')||'';

function detailSheet(ex){
  const start=imgUrl(ex.images?.flat?.start||ex.images?.flat?.main),peak=imgUrl(ex.images?.flat?.peak);
  sheet(`<h3>${esc(ex.name_de)}</h3>
    <div class="grid2 mb3">${start?`<img src="${start}" style="width:100%;border-radius:12px;display:block;background:var(--bg3)">`:''}${peak?`<img src="${peak}" style="width:100%;border-radius:12px;display:block;background:var(--bg3)">`:''}</div>
    <div class="tiny mb3">${[ex.equipment&&'Gerät: '+ex.equipment.replace(/_/g,' '),ex.difficulty&&{beginner:'Anfänger',intermediate:'Fortgeschritten',advanced:'Erfahren'}[ex.difficulty]].filter(Boolean).join(' · ')}</div>
    ${ex.primary_muscles?.length?`<div class="mb2"><span class="tiny">Zielmuskeln: </span>${ex.primary_muscles.map(m=>`<span class="tag main">${musc(m)}</span>`).join('')}${(ex.secondary_muscles||[]).map(m=>`<span class="tag">${musc(m)}</span>`).join('')}</div>`:''}
    ${ex.instructions_de?.length?`<h2 style="margin-top:16px">Ausführung</h2><div class="card sub"><ol style="padding-left:18px">${ex.instructions_de.map(s=>`<li style="margin-bottom:6px">${esc(s)}</li>`).join('')}</ol></div>`:''}
    ${ex.tips_de?.length?`<h2>Tipps</h2><div class="card sub"><ul style="padding-left:18px">${ex.tips_de.map(s=>`<li style="margin-bottom:6px">${esc(s)}</li>`).join('')}</ul></div>`:''}
    <div class="tiny mt3">${ATTR}</div>
    <button class="btn wide mt3" data-x="close">Schließen</button>`,{close:closeSheet});
}

export function dbSearchSheet(prefill){
  let results=[];
  const draw=()=>sheet(`<h3>Übungsdatenbank</h3>
    <input id="edq" placeholder="z. B. Bankdrücken, Kniebeuge, Bizeps" value="${esc(prefill||'')}" autocapitalize="off"><div id="edr" class="mt2"></div>
    <div class="tiny mt3">${ATTR}</div>`,{
    close:closeSheet,pick:b=>{const ex=results[+b.dataset.i];if(ex)detailSheet(ex)},
    _input:async ev=>{if(ev.target.id!=='edq')return;const q=ev.target.value.trim();const box=el('edr');
      if(q.length<2){box.innerHTML='';return}
      box.innerHTML='<div class="muted" style="padding:12px 0">Suche…</div>';
      results=await search(q);
      box.innerHTML=results.length?results.map((ex,i)=>`<button class="food" data-x="pick" data-i="${i}"><div class="grow"><div class="fn">${esc(ex.name_de)}</div><div class="fb">${esc(ex.body_part||'').replace(/_/g,' ')}</div></div><span class="fm">${imgUrl(ex.images?.flat?.start||ex.images?.flat?.main)?'📷':''}</span></button>`).join(''):'<div class="empty">Nichts gefunden.</div>';
    }});
  draw();
  if(prefill){search(prefill).then(r=>{results=r;const box=el('edr');if(box)box.innerHTML=r.length?r.map((ex,i)=>`<button class="food" data-x="pick" data-i="${i}"><div class="grow"><div class="fn">${esc(ex.name_de)}</div><div class="fb">${esc(ex.body_part||'').replace(/_/g,' ')}</div></div></button>`).join(''):'<div class="empty">Nichts gefunden.</div>'})}
}

// Von einer eigenen Übung aus: erst automatisch zuordnen, sonst Suche mit dem Namen vorausfüllen.
export async function openGuide(exerciseName){
  toast('Suche Anleitung…');
  const cleanName=exerciseName.replace(/\s*\([^)]*\)\s*/g,' ').trim();
  const match=await autoMatch(exerciseName)||await autoMatch(cleanName);
  if(match)detailSheet(match);else dbSearchSheet(cleanName);
}
