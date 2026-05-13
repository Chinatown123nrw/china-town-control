# VIP & Kooperationen Kontrolle

Statische Website zur Verwaltung von VIPs, Kooperationen, Bestellungen und Tischreservierungen. Die Daten werden im Browser per `localStorage` gespeichert und koennen als JSON exportiert oder importiert werden.

## Funktionen

- VIP Kunden mit Silber- oder Gold-Paket eintragen.
- VIP Laufzeit kann in Monaten gesetzt werden, ein Monat entspricht 31 Tagen.
- VIP Abholung hat immer vier Sterne fuer die vier Wochen im aktuellen Monat.
- Beim Anklicken eines Sterns wird das kurze Abholdatum darunter gespeichert, z. B. `16.5.`.
- Kooperationen mit Codewort, Vorteilen, Ablaufdatum und monatlichem Reminder verwalten.
- Bestellungen mit Inhalt, Zeit und Betrag erfassen.
- Tischreservierungen mit Uhrzeit, Personen, Tisch/Bereich und Anlass erfassen.
- Tabs fuer Heute, VIPs, Kooperationen, Bestellungen, Reservierungen und Archiv.
- Status-Schnellbuttons fuer Bestellungen und Reservierungen direkt in der Tabelle.
- VIP Schnellaktionen fuer `+1M`, `+3M` und `Neuer Monat`.
- Warnungen fuer bald ablaufende VIPs, faellige Kooperations-Reminder und ueberfaellige Bestellungen.
- Einfacher lokaler Passwortschutz mit Session-Freigabe.
- Abgelaufene und bald faellige Eintraege ueber die Uebersicht erkennen.
- Daten exportieren und importieren.

## Lokal öffnen

Oeffne `index.html` direkt im Browser.

## Kostenlos hosten

- GitHub Pages: Repository erstellen, Dateien hochladen, unter `Settings > Pages` den Branch veröffentlichen.
- Netlify: Ordner per Drag & Drop in Netlify hochladen.
- Vercel: Repository importieren, als statische Seite deployen.

Für diese Website ist kein Backend und keine Datenbank nötig.
