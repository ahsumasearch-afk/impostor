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
| `js/questions.js` | Die 850 Fragenpaare und die 17 Kategorien |
| `js/core.js` | Speicher, Identität, Hilfsfunktionen, gemeinsamer Zustand |
| `js/host.js` | Spiellogik – der Host hält den Zustand |
| `js/net.js` | Verbindungsaufbau und Herzschlag zwischen den Geräten |
| `js/notify.js` | Uhr, Ton, Benachrichtigungen |
| `js/render.js` | Zeichnen mit gezieltem Aktualisieren statt Neuaufbau |
| `js/screens.js` | Start-, Einladungs- und Fehlerbildschirme |
| `js/game.js` | Warteraum und Spielbildschirme |
| `js/app.js` | Startpunkt |

## Funktionen

- **850 Fragenpaare**, 1700 verschiedene Fragen, keine doppelt. Beide Fragen eines
  Paares verlangen dieselbe Art Antwort – nie Zahl gegen Wort, nie Uhrzeit gegen
  Begriff, nie Dauer gegen Anzahl. Auch die Größenordnung passt zusammen.
  Gleichzeitig sind die beiden Fragen nie bedeutungsgleich, sonst wäre die Runde
  langweilig: Sie liegen nah beieinander, zielen aber auf etwas anderes. Der Host zieht
  ohne Zurücklegen – erst wenn der gewählte Vorrat durch ist, fängt er von vorn an.
- **17 Kategorien mit je genau 50 Paaren:** Zahlen & Mengen, Alltag & Routine,
  Essen & Trinken, Orte & Reisen, Menschen, Über dich, Dinge & Geld, Arbeit & Schule,
  Internet & Apps, Feste & Jahreszeiten, Sport, Musik, Filme & Serien, Games, Tiere,
  Autos & Fahren, Kultur & Wissen. Der Host wählt im Warteraum aus, woraus gezogen wird;
  ohne Auswahl lässt sich keine Runde starten. Die anderen sehen die Auswahl.
- Sobald alle geantwortet oder abgestimmt haben, geht es sofort weiter –
  ein laufender Timer wird nicht abgewartet.
- **Frage überspringen:** Der Host kann jederzeit eine neue Frage ziehen.
- **Drei Zeitlimits** (Antwort, Besprechung, Abstimmung): Knöpfe für kurze Zeiten,
  daneben ein Feld für eine freie Minutenzahl von 2 bis 60. Nur der Host darf das.
- **Teamwertung:** Erwischt die Mehrheit den Lügner, bekommt jeder im Team +1.
  Kommt er durch, bekommt er allein +1 – auch wer richtig getippt hat, geht dann leer aus.
- **Aussehen:** Name, Emoji aus 492 Symbolen, 16 kräftige Farbtöne plus
  freier Farbwähler – im Warteraum jederzeit änderbar (nicht der Name).
- **Ergebnis:** Bei jedem Namen stehen seine Frage, seine Antwort und für wen er
  gestimmt hat – die abweichende Frage des Lügners ist farblich abgesetzt.
- **Raum-Code oben in der Leiste:** antippen kopiert den Einladungslink.
- **Warteraum:** alle Abschnitte sind zuklappbar und zeigen zugeklappt eine
  Zusammenfassung. „Runde starten" sitzt auf dem Desktop unter der Spielerliste.
- **Chat pro Raum** mit eigenem Emoji-Feld (142 Reaktionen, werden an der
  Schreibmarke eingefügt), Kick-Funktion für den Host, Raum verlassen für alle.
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
