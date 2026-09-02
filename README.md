# Fragen-Impostor

Party-Spiel für 3+ Spieler. Alle beantworten dieselbe Frage – nur eine Person
bekommt eine andere, ähnliche Frage. Danach werden alle Antworten und die
Hauptfrage aufgedeckt, mündlich diskutiert und abgestimmt, wer der Lügner war.

## Technik

- Eine einzige statische Datei: `index.html` (kein Build, kein Backend)
- Multiplayer über WebRTC / [PeerJS](https://peerjs.com) – der Host ist der Server,
  alle anderen verbinden sich per 4-stelligem Raum-Code direkt zu ihm
- Läuft deshalb auf jedem Static-Hosting (GitHub Pages, Netlify, IONOS …)

## Funktionen

- Chat pro Raum (jeder Raum hat seinen eigenen, Verlauf bleibt über die Runden erhalten)
- Der Host kann Spieler im Warteraum entfernen; Entfernte kommen über den Link nicht zurück
- Neuladen ändert nichts: Jeder Tab hat eine eigene Identität, die einen Reload überlebt –
  Punkte, Name und Platz im Raum bleiben. Auch der Host kann neu laden, der Raum lebt weiter.
- Fällt jemand kurz aus, wartet die Runde 20 Sekunden auf ihn, statt ihn zu überspringen

## Wichtig

Der Host muss die Seite geöffnet lassen – schließt er den Tab dauerhaft, ist der Raum weg.
Ein Neuladen ist dagegen unproblematisch.

## Lokal testen

```bash
python3 -m http.server 8000
```

Dann http://localhost:8000 öffnen.

## Punkte

- +1 für jeden, der den Lügner richtig erwischt
- +2 für den Lügner, wenn er nicht (eindeutig) erwischt wird
