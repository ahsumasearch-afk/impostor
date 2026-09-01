# Fragen-Impostor

Party-Spiel für 3+ Spieler. Alle beantworten dieselbe Frage – nur eine Person
bekommt eine andere, ähnliche Frage. Danach werden alle Antworten und die
Hauptfrage aufgedeckt, mündlich diskutiert und abgestimmt, wer der Lügner war.

## Technik

- Eine einzige statische Datei: `index.html` (kein Build, kein Backend)
- Multiplayer über WebRTC / [PeerJS](https://peerjs.com) – der Host ist der Server,
  alle anderen verbinden sich per 4-stelligem Raum-Code direkt zu ihm
- Läuft deshalb auf jedem Static-Hosting (GitHub Pages, Netlify, IONOS …)

## Wichtig

Der Host muss die Seite geöffnet lassen – schließt der Host den Tab, ist der Raum weg.

## Lokal testen

```bash
python3 -m http.server 8000
```

Dann http://localhost:8000 öffnen.

## Punkte

- +1 für jeden, der den Lügner richtig erwischt
- +2 für den Lügner, wenn er nicht (eindeutig) erwischt wird
