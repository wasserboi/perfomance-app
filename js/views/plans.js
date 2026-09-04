import {S,save,clone,uid,esc,TYPES,stageLabel,APP_VERSION,today,e1rm,renameExercise,replaceState} from '../state.js';
import {sheet,closeSheet,toast,confirm2,rerender,dl,csv,el} from '../ui.js';
import {SY,syncText,connect,pushSync,pullSync,listSnapshots,restoreSnapshot} from '../sync.js';
import {checkUpdate,changelogSheet} from '../app.js';

const gear='<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>';

function html(){
  return `<div class="row between"><h1>Pläne<small>Vorlagen für dein Training</small></h1><button class="btn ghost" data-a="settings" aria-label="Einstellungen">${gear}</button></div>
  ${S.plans.map(p=>`<div class="card"><div class="row between"><div style="font-weight:600;font-size:17px">${esc(p.name)}</div><button class="btn ghost sm" data-a="edit" data-id="${p.id}">Bearbeiten</button></div>
  <div class="muted mt2">${p.exercises.map(e=>e.main?`<span class="tag main">Main</span>${esc(e.name)} <span class="tiny">${stageLabel(e.state?.stage||0)} @ ${e.state?.weight||e.weight} kg</span>`:`<span class="tag">${(e.type||'')[0]||''}</span>${esc(e.name)} <span class="tiny">${e.sets}×${e.reps}</span>`).join('<br>')}</div></div>`).join('')||'<div class="empty">Noch keine Pläne. Lege z. B. Push, Pull, Legs an.</div>'}
  <button class="btn wide primary" data-a="edit">+ Neuer Plan</button>
  <div class="tiny mt4">${SY.token?'Backup: '+syncText():'Kein Cloud-Backup – in den Einstellungen einrichten'}</div>`;
}

export function moveItem(arr,from,to){if(to<0||to>=arr.length||from===to)return arr;const [x]=arr.splice(from,1);arr.splice(to,0,x);return arr}
function planSheet(id){
  const p=id?clone(S.plans.find(x=>x.id===id)):{id:uid(),name:'',exercises:[]};
  const draw=()=>sheet(`<h3>${id?'Plan bearbeiten':'Neuer Plan'}</h3>
    <div class="field"><label class="f">Name</label><input id="pn" value="${esc(p.name)}" placeholder="z. B. Push"></div>
    ${p.exercises.map((e,i)=>`<div class="prow" data-row="${i}"><div class="row"><input class="grow" value="${esc(e.name)}" data-pf="name" data-i="${i}" placeholder="Übung"><div class="ord"><button class="icon" data-x="up" data-i="${i}" ${i===0?'disabled':''}>▲</button><button class="icon" data-x="down" data-i="${i}" ${i===p.exercises.length-1?'disabled':''}>▼</button></div><button class="btn ghost sm" data-x="rm" data-i="${i}">✕</button></div>
      <div class="row mt2"><select data-pf="type" data-i="${i}" class="grow">${TYPES.map(t=>`<option ${e.type===t?'selected':''}>${t}</option>`).join('')}</select><button class="btn sm ${e.main?'primary':''}" data-x="main" data-i="${i}">Main</button></div>
      ${e.main?`<div class="row mt2"><div class="grow"><label class="f">Ausgangsgewicht (kg)</label><input type="number" inputmode="decimal" step="0.5" value="${e.weight||''}" data-pf="weight" data-i="${i}"></div><div style="width:90px"><label class="f">Schritt (kg)</label><input type="number" inputmode="decimal" step="0.5" value="${e.step||10}" data-pf="step" data-i="${i}"></div></div><div class="tiny mt2">3-5-7: 10×3 → 7×5 → 5×7, dann +Schritt</div>`
      :`<div class="row mt2"><span class="tiny">Sätze</span><input type="number" inputmode="numeric" style="width:64px" value="${e.sets}" data-pf="sets" data-i="${i}"><span class="tiny">× Reps</span><input type="number" inputmode="numeric" style="width:64px" value="${e.reps}" data-pf="reps" data-i="${i}"></div>`}
    </div>`).join('')}
    <button class="btn sm" data-x="add">+ Übung</button><div class="tiny mt2 mb4">Mit ▲▼ die Reihenfolge ändern.</div>
    <div class="grid2"><button class="btn" data-x="close">Abbrechen</button><button class="btn primary" data-x="save">Speichern</button></div>
    ${id?'<button class="btn ghost danger wide mt2" data-x="del">Plan löschen</button>':''}`,{
    _input:ev=>{const t=ev.target;if(t.id==='pn')p.name=t.value;if(t.dataset.pf){const f=t.dataset.pf,e=p.exercises[t.dataset.i];e[f]=(f==='name'||f==='type')?t.value:+t.value;if(f==='weight')e.state={weight:+t.value,stage:0}}},
    _change:ev=>{const t=ev.target;if(t.dataset.pf==='type')p.exercises[t.dataset.i].type=t.value},
    add:()=>{p.exercises.push({name:'',type:'Freihand',sets:3,reps:10});draw()},
    up:b=>{moveItem(p.exercises,+b.dataset.i,+b.dataset.i-1);draw()},
    down:b=>{moveItem(p.exercises,+b.dataset.i,+b.dataset.i+1);draw()},
    rm:b=>{p.exercises.splice(+b.dataset.i,1);draw()},
    main:b=>{const i=+b.dataset.i,was=p.exercises[i].main;p.exercises.forEach(e=>{e.main=false});if(!was){const e=p.exercises[i];e.main=true;e.step=e.step||10;e.state=e.state||{weight:e.weight||0,stage:0}}draw()},
    close:closeSheet,
    del:()=>{if(!confirm2('Plan löschen?'))return;S.plans=S.plans.filter(x=>x.id!==id);save();closeSheet();rerender()},
    save:()=>{p.exercises=p.exercises.filter(e=>e.name.trim());if(!p.name.trim()){toast('Name fehlt');return}const m=p.exercises.find(e=>e.main);if(m&&!m.weight){toast('Ausgangsgewicht für Main fehlt');return}
      const i=S.plans.findIndex(x=>x.id===p.id);i<0?S.plans.push(p):S.plans[i]=p;save();closeSheet();rerender()}});
  draw();
}
export function settingsSheet(){
  sheet(`<h3>Einstellungen</h3>
  <div class="card sub"><div class="grid2"><div><label class="f">Pausenzeit (Sek.)</label><input type="number" inputmode="numeric" id="restIn" value="${S.settings.rest}"></div><div><label class="f">Overload-Schritt (kg)</label><input type="number" inputmode="decimal" step="0.5" id="ovIn" value="${S.settings.overload||2.5}"></div></div><div class="tiny mt2">Wenn du letztes Mal in allen Arbeitssätzen die Ziel-Reps geschafft hast, schlägt die App dieses Plus vor.</div></div>
  <div class="muted mt4 mb2">Cloud-Backup (GitHub)</div>
  <div class="card sub"><div class="row between mb2"><span id="syncStatus" class="muted">${syncText()}</span>${SY.token?'<button class="btn sm" data-x="syncnow">Jetzt sichern</button>':''}</div>
    <div class="field"><label class="f">Privates Repo (Nutzer/Name)</label><input id="syRepo" value="${esc(SY.repo)}" autocapitalize="off" autocorrect="off"></div>
    <div class="field"><label class="f">Token</label><input id="syTok" type="password" value="${esc(SY.token)}" placeholder="github_pat_…" autocapitalize="off" autocorrect="off"></div>
    <div class="grid2"><button class="btn primary" data-x="connect">Verbinden</button><button class="btn" data-x="restore" ${SY.token?'':'disabled'}>Letzten Stand laden</button></div>
    <button class="btn wide mt2" data-x="snaps" ${SY.token?'':'disabled'}>Aus Backup-Historie wiederherstellen</button>
    ${SY.state==='conflict'?'<div class="card sub warn mt2"><div style="font-weight:600">Konflikt</div><div class="tiny mt1">Auf einem anderen Gerät wurde später gesichert. Entweder den Cloud-Stand laden oder diesen hier hochladen.</div><div class="grid2 mt2"><button class="btn sm" data-x="restore">Cloud laden</button><button class="btn sm" data-x="forcepush">Diesen Stand hochladen</button></div></div>':''}
    <div class="tiny mt2">Sichert nach jeder Änderung automatisch ins Repo (Daten, Historie, Fotos). Der Token bleibt nur auf diesem Gerät.</div></div>
  <div class="muted mt4 mb2">Übungen</div>
  <div class="card sub"><button class="btn wide" data-x="exmgr">Übungen verwalten</button><div class="tiny mt2">Umbenennen oder Dubletten zusammenführen – gilt für Verlauf, Pläne, Fortschritt und PRs.</div></div>
  <div class="muted mt4 mb2">Export</div>
  <div class="card sub"><div class="grid2"><button class="btn" data-x="export">JSON-Backup</button><button class="btn" data-x="import">Backup laden</button></div><div class="grid2 mt2"><button class="btn" data-x="csvw">Training als CSV</button><button class="btn" data-x="csvm">Ernährung als CSV</button></div></div>
  <div class="muted mt4 mb2">App</div>
  <div class="card sub"><div class="row between"><span class="muted">Version ${APP_VERSION}</span><button class="btn sm" data-x="upd">Nach Update suchen</button></div><button class="btn ghost sm mt2" data-x="changelog">Was ist neu</button></div>
  <button class="btn wide mt4" data-x="close">Schließen</button>`,{
    _input:ev=>{const t=ev.target;if(t.id==='restIn'){S.settings.rest=+t.value||90;save()}if(t.id==='ovIn'){S.settings.overload=+t.value||2.5;save()}},
    close:()=>{closeSheet();rerender()},
    connect:()=>{toast('Verbinde…');connect(el('syRepo').value,el('syTok').value).then(()=>{settingsSheet();toast(SY.state==='ok'?'Cloud-Backup aktiv':SY.token?'Verbindung fehlgeschlagen':'Getrennt')})},
    syncnow:()=>pushSync(),forcepush:()=>{pushSync(true).then(()=>{settingsSheet();toast('Hochgeladen')})},
    snaps:async()=>{toast('Lade Historie…');try{const list=await listSnapshots();
      sheet(`<h3>Backup-Historie</h3><div class="tiny mb3">Monats-Snapshots im Repo. Der aktuelle Stand wird ersetzt.</div>
        ${list.length?`<div class="list">${list.map(x=>`<button class="food" data-x="pick" data-sha="${x.sha}" data-n="${x.name}"><span class="fn">${x.name}</span><span class="fm">wiederherstellen ›</span></button>`).join('')}</div>`:'<div class="muted">Noch keine Snapshots – der erste entsteht beim nächsten Backup.</div>'}
        <button class="btn wide mt3" data-x="back">Zurück</button>`,{back:settingsSheet,
        pick:async b=>{if(!confirm2('Stand von '+b.dataset.n+' laden? Aktuelle Daten werden ersetzt.'))return;
          try{await restoreSnapshot(b.dataset.sha);toast('Wiederhergestellt');closeSheet();rerender()}catch(e){toast('Fehlgeschlagen: '+e.message)}}});
    }catch(e){toast('Historie nicht abrufbar')}},restore:()=>{if(confirm2('Lokale Daten durch das Cloud-Backup ersetzen?'))pullSync(true).then(()=>{settingsSheet();rerender()})},
    exmgr:()=>exMgrSheet(),
    export:()=>dl('performance-backup-'+today()+'.json',JSON.stringify(S),'application/json'),
    import:()=>{const i=document.createElement('input');i.type='file';i.accept='.json';i.onchange=()=>{const r=new FileReader();r.onload=()=>{try{replaceState(JSON.parse(r.result));save();toast('Backup geladen');closeSheet();rerender()}catch(e){toast('Ungültige Datei')}};r.readAsText(i.files[0])};i.click()},
    csvw:()=>{const rows=[['Datum','Plan','Übung','Satz','Aufwärmen','kg','Reps','e1RM']];S.workouts.forEach(w=>w.exercises.forEach(e=>e.sets.forEach((st,i)=>rows.push([w.date.slice(0,10),w.name,e.name,i+1,st.wu?'ja':'',st.w,st.r,st.wu?'':Math.round(e1rm(st.w,st.r))]))));dl('training-'+today()+'.csv',csv(rows),'text/csv')},
    csvm:()=>{const rows=[['Datum','Produkt','Menge','Einheit','Protein','Carbs','Fett','kcal']];Object.keys(S.macros).sort().forEach(dd=>S.macros[dd].forEach(i=>rows.push([dd,i.n,i.amount||'',i.unit||'',i.p,i.c,i.f,i.kcal||Math.round(i.p*4+i.c*4+i.f*9)])));dl('ernaehrung-'+today()+'.csv',csv(rows),'text/csv')},
    upd:()=>checkUpdate(true),changelog:changelogSheet});
}

function exMgrSheet(sel){
  const counts={};S.workouts.forEach(w=>w.exercises.forEach(e=>counts[e.name]=(counts[e.name]||0)+1));const names=Object.keys(counts).sort((a,b)=>a.localeCompare(b,'de'));
  if(!sel){sheet(`<h3>Übungen (${names.length})</h3><input id="exq" placeholder="Suchen…" class="mb2"><div class="list" id="exl">${names.map(n=>`<button class="food" data-x="pick" data-n="${esc(n)}"><span class="fn">${esc(n)}</span><span class="fm">${counts[n]}×</span></button>`).join('')}</div><button class="btn wide mt3" data-x="close">Schließen</button>`,
      {close:closeSheet,pick:b=>exMgrSheet(b.dataset.n),_input:ev=>{if(ev.target.id!=='exq')return;const q=ev.target.value.toLowerCase();document.querySelectorAll('#exl .food').forEach(b=>b.style.display=b.dataset.n.toLowerCase().includes(q)?'':'none')}});return}
  sheet(`<h3>${esc(sel)}</h3><div class="tiny mb3">${counts[sel]} Trainings</div>
    <div class="field"><label class="f">Umbenennen</label><input id="exn" value="${esc(sel)}"></div><button class="btn wide mb4" data-x="rename">Umbenennen</button>
    <div class="field"><label class="f">Zusammenführen mit</label><select id="exm"><option value="">– wählen –</option>${names.filter(n=>n!==sel).map(n=>`<option>${esc(n)}</option>`).join('')}</select></div><button class="btn wide" data-x="merge">Zusammenführen</button><div class="tiny mt2">"${esc(sel)}" geht in der gewählten Übung auf; deren Name bleibt.</div>
    <button class="btn ghost wide mt4" data-x="back">Zurück</button>`,{
    back:()=>exMgrSheet(),
    rename:()=>{const to=el('exn').value.trim();if(!to)return;if(counts[to]&&to!==sel&&!confirm2('"'+to+'" existiert schon – zusammenführen?'))return;renameExercise(sel,to);toast('Umbenannt');rerender();exMgrSheet()},
    merge:()=>{const to=el('exm').value;if(!to||!confirm2(`"${sel}" in "${to}" zusammenführen?`))return;renameExercise(sel,to);toast('Zusammengeführt');rerender();exMgrSheet()}});
}

export default{html,action(a,d){if(a==='settings')settingsSheet();if(a==='edit')planSheet(d.id)}};
