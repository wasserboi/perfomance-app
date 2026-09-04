import {APP_VERSION,KEY,S,on} from './state.js';
import {registerView,render,rerender,sheet,closeSheet,toast,el,currentTab,setTab} from './ui.js';
import './timer.js';
import {pullSync} from './sync.js';
import * as photos from './photos.js';
import todayView from './views/today.js';
import training from './views/training.js';
import plans from './views/plans.js';
import progress from './views/progress.js';
import body from './views/body.js';
import macros from './views/macros.js';

registerView('today',todayView);registerView('log',training);registerView('plans',plans);registerView('progress',progress);registerView('body',body);registerView('macros',macros);

// ----- Update-Check & Changelog -----
let latest=null;
export async function checkUpdate(manual){
  try{const r=await fetch('version.json?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw 0;const j=await r.json();latest=j;
    if(j.version!==APP_VERSION){el('upd').classList.add('on');if(manual)toast('Update '+j.version+' verfügbar')}else if(manual)toast('Aktuell')}
  catch(e){if(manual)toast('Prüfung fehlgeschlagen')}
}
el('upd').onclick=async()=>{const u=el('upd');u.textContent='Lade Update…';
  try{const ks=await caches.keys();await Promise.all(ks.map(k=>caches.delete(k)))}catch(e){}
  try{if(navigator.serviceWorker){const rs=await navigator.serviceWorker.getRegistrations();await Promise.all(rs.map(r=>r.unregister()))}}catch(e){}
  try{await Promise.all(['index.html','js/app.js','js/state.js','css/app.css'].map(f=>fetch(f,{cache:'reload'})))}catch(e){}
  location.reload()};
export const CHANGES=[
 {v:'25',t:['Trainingskalender entfernt, Wochen-Serie steht jetzt in der Wochenübersicht']},
 {v:'24',t:['Habit-Tracker: Haken oder Kreuz, 14-Tage-Übersicht mit Quote und Serie']},
 {v:'23',t:['Neuer Start-Tab "Heute": Kennzahlen, fälliges Training und Tagesplan zum Abhaken','Supplements anlegen (Name, Dosis, Zeitpunkt, Rhythmus)']},
 {v:'22',t:['Makros-Tab in klare Abschnitte gegliedert, farbige Balken je Makro']},
 {v:'21',t:['Übungen im Plan per ≡ verschieben']},
 {v:'20',t:['Zeitraum-Filter auch beim Gewicht; überall Standard 3 Monate']},
 {v:'19',t:['Getränke zählen auf den Wasserstand; Magnesium, Calcium und Natrium werden mitgezählt']},
 {v:'18',t:['Kein Update-Popup mehr, nur kurzer Hinweis']},
 {v:'17',t:['Menge: Portion wählen + Anzahl mit −/+, oder Gramm-Modus']},
 {v:'16',t:['Standardportionen: 1 Ei, Scheibe Brot, Scoop Whey, EL Öl … als Chips; eigene Portion pro Produkt']},
 {v:'15',t:['Updates laden jetzt automatisch beim Öffnen; Update-Balken zeigt Fortschritt']},
 {v:'14',t:['Grundnahrungsmittel eingebaut (Ei, Hähnchenbrust, Reis …), bessere Suchreihenfolge']},
 {v:'13',t:['Kompletter Umbau: Module statt einer Datei, Design-System, Seiten springen nicht mehr nach oben','±-Tasten für kg und Reps im Training','Haptik beim Abhaken']},
 {v:'12',t:['Diagramme neu, Fotos in der App']},{v:'11',t:['Backup ohne Limit, Übungsverwaltung, Deload, Kalender, Timer-Fix, Autopilot, Wasser']},
 {v:'10',t:['Maße links/rechts']},{v:'9',t:['Layout aufgeräumt']},{v:'8',t:['PRs, Gesamtvolumen']},{v:'7',t:['Einstellungen im Zahnrad']},{v:'6',t:['Main-Übung 3-5-7, Übungstypen']},
 {v:'5',t:['Overload-Vorschlag, Notizen, Aufwärmsätze, Mahlzeiten, Maße']},{v:'4',t:['Barcode-Scanner, Open Food Facts']},{v:'3',t:['Cloud-Backup']},{v:'2',t:['Letztes Training als Vorlage, Kraftvergleich']},{v:'1',t:['Erste Version']}];
export function changelogSheet(){sheet(`<h3>Was ist neu</h3><div class="list">${CHANGES.map(c=>`<div class="item top" style="justify-content:flex-start"><span class="tiny" style="min-width:36px;padding-top:3px">v${c.v}</span><span class="grow">${c.t.join('<br>')}</span></div>`).join('')}</div><button class="btn wide mt3" data-x="close">OK</button>`,{close:closeSheet})}

// ----- Bootstrap -----
if(location.search)history.replaceState(null,'',location.pathname);
if(navigator.storage&&navigator.storage.persist)navigator.storage.persist();
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(r=>r.update()).catch(()=>{});
on('replace',()=>rerender());
on('photos',()=>{if(currentTab()==='body')photos.renderGrid()});
if(localStorage.getItem('perf.seen')!==APP_VERSION){const had=!!localStorage.getItem('perf.seen');localStorage.setItem('perf.seen',APP_VERSION);if(had)setTimeout(()=>toast('Aktualisiert auf Version '+APP_VERSION),800)}
photos.loadMeta().then(()=>{render(true);pullSync();checkUpdate()});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')checkUpdate()});
