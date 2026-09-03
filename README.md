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

## Dateien

- `index.html` – die gesamte App
- `manifest.json` – Name, Icon, Vollbild
- `sw.js` – Service Worker fürs Offline-Caching
- `icon-180.png`, `icon-512.png` – Home-Screen-Icon
