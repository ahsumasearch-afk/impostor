# Fragen-Impostor

Party-Spiel für 3+ Spieler. Alle beantworten dieselbe Frage – nur eine Person
bekommt eine andere, ähnliche Frage. Danach werden alle Antworten und die
Hauptfrage aufgedeckt, mündlich diskutiert und abgestimmt, wer der Lügner war.

**Live:** https://ahsumasearch-afk.github.io/impostor/

## Aufbau

Kein Build, kein Backend – statische Dateien, die der Browser direkt lädt:

| Datei | Inhalt |
|---|---|
| `index.html` | Grundgerüst, lädt Stil und Skripte |
| `css/style.css` | Gesamte Gestaltung |
| `js/questions.js` | Die 157 Fragenpaare und die 11 Kategorien |
| `js/core.js` | Speicher, Identität, Hilfsfunktionen, gemeinsamer Zustand |
| `js/host.js` | Spiellogik – der Host hält den Zustand |
| `js/net.js` | Verbindungsaufbau und Herzschlag zwischen den Geräten |
| `js/notify.js` | Uhr, Ton, Benachrichtigungen |
| `js/render.js` | Zeichnen mit gezieltem Aktualisieren statt Neuaufbau |
| `js/screens.js` | Start-, Einladungs- und Fehlerbildschirme |
| `js/game.js` | Warteraum und Spielbildschirme |
| `js/app.js` | Startpunkt |

## Funktionen

- **157 Fragenpaare**, 314 verschiedene Fragen, keine doppelt. Der Host zieht
  ohne Zurücklegen – erst wenn alle durch sind, fängt der Vorrat von vorn an.
- **11 Kategorien** (Zahlen, Alltag, Essen, Orte, Menschen, Über dich, Dinge,
  Arbeit, Medien, Feste, Fantasie). Der Host wählt im Warteraum aus, woraus
  gezogen wird; nichts ausgewählt heißt alle. Die anderen sehen die Auswahl.
- Sobald alle geantwortet oder abgestimmt haben, geht es sofort weiter –
  ein laufender Timer wird nicht abgewartet.
- **Frage überspringen:** Der Host kann jederzeit eine neue Frage ziehen.
- **Drei Zeitlimits** (Antwort, Besprechung, Abstimmung): Knöpfe für kurze Zeiten,
  daneben ein Feld für eine freie Minutenzahl von 2 bis 60. Nur der Host darf das.
- **Teamwertung:** Erwischt die Mehrheit den Lügner, bekommt jeder im Team +1.
  Kommt er durch, bekommt er allein +1 – auch wer richtig getippt hat, geht dann leer aus.
- **Aussehen:** Name, Emoji aus über 100 Symbolen und eine von 14 Farben,
  im Warteraum jederzeit änderbar (Emoji und Farbe, nicht der Name).
- **Raum-Code oben in der Leiste:** antippen kopiert den Einladungslink.
- **Chat pro Raum**, Kick-Funktion für den Host, Raum verlassen für alle.
- **Neuladen ändert nichts:** Punkte, Name und Platz bleiben, auch beim Host.
- **Kein Flackern:** Die Oberfläche wird nicht neu aufgebaut, sondern es wird nur
  das geändert, was sich unterscheidet – Eingaben, Cursor und Scrollposition bleiben.
- Signalton und sprechender Tab-Titel bei jedem Phasenwechsel.

## Zwischenspeicher

Die Dateien werden mit `?v=<Version>` eingebunden. Bei jeder Veröffentlichung wird
die Nummer erhöht, damit niemand eine Mischung aus alten und neuen Dateien lädt.

## Technik

Multiplayer über WebRTC ([PeerJS](https://peerjs.com)): Der Host ist der Server,
alle anderen verbinden sich per 4-stelligem Raum-Code direkt zu ihm. Läuft deshalb
auf jedem Static-Hosting. Der Host muss die Seite offen lassen – ein Neuladen ist
dagegen unproblematisch.

## Lokal testen

```bash
python3 -m http.server 8000
```

Dann http://localhost:8000 öffnen.
