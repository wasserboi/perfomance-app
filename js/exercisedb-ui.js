import {esc} from './state.js';
import {sheet,closeSheet,toast,el} from './ui.js';
import {search,autoMatch,imgUrl,bodyParts,byBodyPart} from './exercisedb.js';

const ATTR='Übungsdaten von <a href="https://repdb.co" target="_blank" rel="noopener" style="color:var(--accent2)">RepDB (repdb.co)</a>';
const DIFF={beginner:'Anfänger',intermediate:'Fortgeschritten',advanced:'Erfahren'};
const MUSCLE_DE={pectoralis_major:'Brust',anterior_deltoid:'vordere Schulter',lateral_deltoid:'seitliche Schulter',posterior_deltoid:'hintere Schulter',
  latissimus_dorsi:'breiter Rücken',trapezius:'Trapez',rhomboids:'Rautenmuskel',erector_spinae:'Rückenstrecker',
  biceps_brachii:'Bizeps',triceps_brachii:'Trizeps',forearm_flexors:'Unterarm',
  rectus_abdominis:'gerader Bauchmuskel',obliques:'seitliche Bauchmuskeln',transverse_abdominis:'querer Bauchmuskel',
  quadriceps:'Quadrizeps',hamstrings:'hintere Oberschenkel',gluteus_maximus:'großer Gesäßmuskel',gluteus_medius:'mittlerer Gesäßmuskel',
  adductors:'Adduktoren',abductors:'Abduktoren',gastrocnemius:'Wade',soleus:'Wade (Soleus)',hip_flexors:'Hüftbeuger',serratus_anterior:'vorderer Sägemuskel'};
const musc=k=>MUSCLE_DE[k]||k?.replace(/_/g,' ')||'';
const thumb=ex=>imgUrl(ex.images?.flat?.start||ex.images?.flat?.main);

// onPick(name_de) optional: wenn gesetzt, zeigt die Anleitung zusätzlich "Diese Übung übernehmen".
function detailSheet(ex,onPick,back){
  const start=imgUrl(ex.images?.flat?.start||ex.images?.flat?.main),peak=imgUrl(ex.images?.flat?.peak);
  sheet(`<h3>${esc(ex.name_de)}</h3>
    <div class="grid2 mb3">${start?`<img src="${start}" style="width:100%;border-radius:12px;display:block;background:var(--bg3)">`:''}${peak?`<img src="${peak}" style="width:100%;border-radius:12px;display:block;background:var(--bg3)">`:''}</div>
    <div class="tiny mb3">${[ex.equipment&&'Gerät: '+ex.equipment.replace(/_/g,' '),ex.difficulty&&DIFF[ex.difficulty]].filter(Boolean).join(' · ')}</div>
    ${ex.primary_muscles?.length?`<div class="mb2"><span class="tiny">Zielmuskeln: </span>${ex.primary_muscles.map(m=>`<span class="tag main">${musc(m)}</span>`).join('')}${(ex.secondary_muscles||[]).map(m=>`<span class="tag">${musc(m)}</span>`).join('')}</div>`:''}
    ${ex.instructions_de?.length?`<h2 style="margin-top:16px">Ausführung</h2><div class="card sub"><ol style="padding-left:18px">${ex.instructions_de.map(s=>`<li style="margin-bottom:6px">${esc(s)}</li>`).join('')}</ol></div>`:''}
    ${ex.tips_de?.length?`<h2>Tipps</h2><div class="card sub"><ul style="padding-left:18px">${ex.tips_de.map(s=>`<li style="margin-bottom:6px">${esc(s)}</li>`).join('')}</ul></div>`:''}
    <div class="tiny mt3">${ATTR}</div>
    ${onPick?`<button class="btn primary wide mt3" data-x="pick">Diese Übung übernehmen</button>`:''}
    ${back?`<button class="btn ghost wide mt2" data-x="back">Zurück</button>`:''}
    <button class="btn wide mt2" data-x="close">Schließen</button>`,{
    close:closeSheet,back:back||undefined,pick:onPick?()=>{closeSheet();onPick(ex.name_de)}:undefined});
}

// Liste einer Körperregion – jede Zeile mit Bildvorschau.
function partListSheet(part,label,onPick,back){
  const draw=async()=>{
    const list=await byBodyPart(part);
    sheet(`<h3>${label}</h3><div class="tiny mb3">${list.length} Übungen</div>
      <div class="list">${list.map((ex,i)=>{const t=thumb(ex);return `<button class="food" data-x="pick" data-i="${i}">${t?`<img src="${t}" style="width:44px;height:44px;border-radius:8px;object-fit:cover;background:var(--bg3);flex:none">`:'<div style="width:44px;height:44px;border-radius:8px;background:var(--bg3);flex:none"></div>'}<div class="grow" style="margin-left:10px"><div class="fn">${esc(ex.name_de)}</div><div class="fb">${ex.equipment?ex.equipment.replace(/_/g,' '):''}</div></div></button>`}).join('')}</div>
      <button class="btn ghost wide mt3" data-x="back">Zurück</button>`,{
      back:()=>back(),pick:b=>detailSheet(list[+b.dataset.i],onPick,()=>draw())});
  };draw();
}

// Körperteil-Browser: Region wählen -> Liste mit Bild -> Anleitung. onPick optional fürs Hinzufügen einer Übung.
export function browseSheet(onPick){
  const draw=async()=>{
    const parts=await bodyParts();
    sheet(`<h3>Übungsdatenbank</h3>
      <button class="btn wide mb3" data-x="search">Nach Namen suchen</button>
      <div class="tiny mb2">Nach Körperteil</div>
      <div class="list">${parts.map(p=>`<button class="item" data-x="part" data-p="${p.key}" style="width:100%;text-align:left;background:none;border:none"><span class="grow">${p.label}</span><span class="tiny">${p.count} ›</span></button>`).join('')}</div>
      <div class="tiny mt3">${ATTR}</div>`,{
      search:()=>dbSearchSheet(null,onPick,()=>draw()),
      part:b=>{const p=parts.find(x=>x.key===b.dataset.p);partListSheet(p.key,p.label,onPick,()=>draw())}});
  };draw();
}

export function dbSearchSheet(prefill,onPick,back){
  let results=[];
  const draw=()=>sheet(`<h3>Übungen suchen</h3>
    <input id="edq" placeholder="z. B. Bankdrücken, Kniebeuge, Bizeps" value="${esc(prefill||'')}" autocapitalize="off"><div id="edr" class="mt2"></div>
    <div class="tiny mt3">${ATTR}</div>
    ${back?`<button class="btn ghost wide mt3" data-x="back">Zurück</button>`:''}
    <button class="btn wide mt2" data-x="close">Schließen</button>`,{
    close:closeSheet,back:back||undefined,pick:b=>{const ex=results[+b.dataset.i];if(ex)detailSheet(ex,onPick,()=>draw())},
    _input:async ev=>{if(ev.target.id!=='edq')return;const q=ev.target.value.trim();const box=el('edr');
      if(q.length<2){box.innerHTML='';return}
      box.innerHTML='<div class="muted" style="padding:12px 0">Suche…</div>';
      results=await search(q);
      box.innerHTML=results.length?results.map((ex,i)=>{const t=thumb(ex);return `<button class="food" data-x="pick" data-i="${i}">${t?`<img src="${t}" style="width:44px;height:44px;border-radius:8px;object-fit:cover;background:var(--bg3);flex:none">`:''}<div class="grow" style="margin-left:10px"><div class="fn">${esc(ex.name_de)}</div><div class="fb">${esc(ex.body_part||'').replace(/_/g,' ')}</div></div></button>`}).join(''):'<div class="empty">Nichts gefunden.</div>';
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
