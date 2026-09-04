# Performance – Trainings-Tracker (PWA)

Läuft komplett lokal im Browser, Daten bleiben auf dem Gerät (localStorage).

## Auf dem iPhone installieren (kostenlos, ca. 5 Minuten)

1. Neues Repo auf GitHub anlegen (z. B. `performance`), diese Dateien hochladen.
2. Repo → Settings → Pages → Source: "Deploy from a branch", Branch `main`, Ordner `/ (root)` → Save.
3. Nach ~1 Minute ist die App unter `https://DEINNAME.github.io/performance/` erreichbar.
4. iPhone: Safari öffnen, URL aufrufen, Teilen-Button → "Zum Home-Bildschirm".
5. App vom Home-Bildschirm starten – Vollbild, offline-fähig.

Änderungen: Datei anpassen, pushen, App einmal schließen und neu öffnen.

## Backup

Pläne → "Backup exportieren" speichert alle Daten als JSON (z. B. in iCloud Drive).
Wenn du die Safari-Website-Daten löschst oder die App vom Home-Bildschirm entfernst, sind die Daten weg – also regelmäßig exportieren.

## Struktur

- `index.html` – Shell (Navigation, Timer, Sheet)
- `css/app.css` – Design-Tokens und Komponenten
- `js/state.js` – Datenmodell, Speichern, Trainings-/Ernährungslogik
- `js/ui.js` – Sheet, Toast, Tab-Rendering
- `js/sync.js` – Cloud-Backup (Git-Data-API)
- `js/photos.js` – Fotos (IndexedDB + Repo-Blobs)
- `js/charts.js`, `js/timer.js`, `js/food.js`
- `js/views/*.js` – je ein Modul pro Tab
- `test/test.js` – Kernflows in jsdom (`npm install && npm test`)
- `sw.js` – Service Worker fürs Offline-Caching

## Cloud-Backup

Die App sichert automatisch nach jeder Änderung `data.json` (aktuelle Daten) und `history.json` (Trainings älter als 90 Tage) per Git-Data-API in ein privates GitHub-Repo (Standard: `wasserboi/perf-data`).
Einrichten: Pläne → Cloud-Backup → Token eintragen → Verbinden. Der Token liegt nur im Gerät, nicht im Code.
Jeder Stand ist in der Commit-Historie des Daten-Repos abrufbar.
