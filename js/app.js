import {APP_VERSION,KEY,S,on,initState} from './state.js';
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
 {v:'38',t:['Stangengewicht separat vom eingetragenen Zusatzgewicht: unter Übungen verwalten hinterlegbar, Sammel-Button für alle "(Barbell)"-Übungen. Zählt jetzt korrekt mit bei bewegten Tonnen, geschätztem 1RM, Kraftstandard und PR-Wand – Eingabefeld bleibt unverändert']},
 {v:'37',t:['Fehler behoben: Makros zeigte nach Mitternacht noch den Vortag, wenn die App durchgehend offen blieb – Datum wird jetzt immer frisch berechnet und aktualisiert sich automatisch um 00:00']},
 {v:'36',t:['Körper-Heatmap: Muskelgruppen-Volumen der Woche als Körperdiagramm (vorne/hinten)','PR-Wand: Chronik aller Bestleistungen','Foto-Vergleich mit Schieberegler','Grobe Kraftstandard-Einordnung bei Bankdrücken/Kniebeuge/Kreuzheben/Schulterdrücken','Wochenrückblick als teilbares Bild','Konfetti bei einem PR','Nächstes rundes Trainingsziel je Übung']},
 {v:'35',t:['Backup-Fehler behoben: Fotos/Snapshots werden beim Lesen jetzt vollständig gefunden (rekursiver Abruf)','Sync markiert Inhalte erst nach bestätigtem Commit als gesichert, nicht schon beim Hochladen','Automatischer Sicherungsstand jetzt vor jeder Ersetzung lokaler Daten, auch beim Import und beim Geräteabgleich']},
 {v:'34',t:['Speicherung aufgeteilt: Training und übrige Daten getrennt, spürbar weniger Schreibarbeit','Bestwerte je Übung als Index statt komplettem Neudurchsuchen bei jedem Satz','Automatischer Sicherungsstand vor jedem Wiederherstellen, rückgängig machbar']},
 {v:'33',t:['Daten liegen jetzt in der IndexedDB (kein 5-MB-Limit mehr), localStorage bleibt Notfallkopie','Schema-Versionierung mit Migrationen','Monats-Snapshots im Backup + Wiederherstellen aus der Historie','Prüfung beim Wiederherstellen, Konflikt-Erkennung bei zwei Geräten','Monatliche Erinnerung an ein lokales Backup']},
 {v:'32',t:['Höhe wird jetzt live gemessen – Tab-Leiste sitzt korrekt am unteren Rand']},
 {v:'31',t:['Höhe der App korrigiert – Leiste sitzt am Rand']},
 {v:'30',t:['Tab-Leiste sitzt jetzt bündig am unteren Rand']},
 {v:'29',t:['Tab-Leiste bleibt beim Scrollen fest unten']},
 {v:'28',t:['Training aufgeräumt: Fortschrittsbalken, Sätze in eigenem Block, Optionen im ···-Menü']},
 {v:'27',t:['Reihenfolge per ▲▼-Tasten statt Ziehen – im Plan und im laufenden Training']},
 {v:'26',t:['Übungen auch im laufenden Training per ≡ umsortieren']},
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

// ----- Viewport-Höhe (iOS: 100dvh ist im Standalone-Modus unzuverlässig) -----
function setVH(){const h=(window.visualViewport&&window.visualViewport.height>window.innerHeight?window.visualViewport.height:window.innerHeight)||window.innerHeight;
  document.documentElement.style.setProperty('--vh',h+'px')}
setVH();window.addEventListener('resize',setVH);window.addEventListener('orientationchange',()=>setTimeout(setVH,200));
if(window.visualViewport)window.visualViewport.addEventListener('resize',()=>{if(!document.activeElement||!/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName))setVH()});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(setVH,50)});

// ----- Monatliche Erinnerung an lokales Backup -----
function monthlyExportReminder(){
  const mon=new Date().toISOString().slice(0,7);
  if(localStorage.getItem('perf.exportMonth')===mon)return;
  if(!localStorage.getItem('perf.seen'))return;// nicht beim allerersten Start
  setTimeout(()=>{
    if(el('sheet').classList.contains('on'))return; // nicht mitten in einer offenen Eingabe dazwischenfunken
    sheet(`<h3>Monatliches Backup</h3><div class="muted mb3">Lege einmal im Monat eine Sicherungsdatei in deine Dateien-App – unabhängig vom Cloud-Backup.</div>
    <button class="btn primary wide" data-x="exp">Backup-Datei erstellen</button><button class="btn wide mt2" data-x="later">Später</button>`,{
    later:()=>{localStorage.setItem('perf.exportMonth',mon);closeSheet()},
    exp:()=>{import('./ui.js').then(u=>u.dl('performance-'+mon+'.json',JSON.stringify(S),'application/json'));localStorage.setItem('perf.exportMonth',mon);closeSheet()}});},2500);
}

// ----- Bootstrap -----
if(location.search)history.replaceState(null,'',location.pathname);
if(navigator.storage&&navigator.storage.persist)navigator.storage.persist();
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(r=>r.update()).catch(()=>{});
on('replace',()=>rerender());
on('photos',()=>{if(currentTab()==='body')photos.renderGrid()});
if(localStorage.getItem('perf.seen')!==APP_VERSION){const had=!!localStorage.getItem('perf.seen');localStorage.setItem('perf.seen',APP_VERSION);if(had)setTimeout(()=>toast('Aktualisiert auf Version '+APP_VERSION),800)}
initState().then(()=>photos.loadMeta()).then(()=>{render(true);pullSync();checkUpdate();monthlyExportReminder()});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')checkUpdate()});

// ----- Automatischer Wechsel um Mitternacht -----
// Tabs berechnen "heute" grundsätzlich frisch bei jedem Rendern (kein gecachtes Datum),
// dadurch stimmt die Anzeige sofort nach jeder Interaktion. Diese Uhr sorgt zusätzlich dafür,
// dass sich die Ansicht auch von selbst aktualisiert, wenn das Telefon einfach über Mitternacht
// hinweg auf dem gleichen Bildschirm liegen bleibt, ohne dass jemand etwas antippt.
let lastDay=new Date().toDateString();
function checkDayRollover(){const d=new Date().toDateString();if(d!==lastDay){lastDay=d;rerender()}}
setInterval(checkDayRollover,60000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')checkDayRollover()});
