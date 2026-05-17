# China Town VIP & Kooperation Control

Statische Website fuer VIPs und Kooperationen im China Town Control. Bestellungen und Tischreservierungen sind als zusaetzliche operative Module enthalten. Die App kann lokal im Browser laufen, oder zentral mit Supabase fuer alle Geraete.

## Funktionen

- VIP Kunden mit Silber- oder Gold-Paket
- VIP Laufzeit in Monaten
- 4 Abhol-Sterne pro VIP-Monat
- Kooperationen mit Codewort, Vorteilen und Reminder
- Bestellungen mit Inhalt, Zeit und Betrag
- Tischreservierungen mit Zeit, Personen, Tisch und Anlass
- Events mit Uhrzeit, Ort und Details
- Rollen: Admin, Manager und Mitarbeiter
- Heute-Tab fuer faellige VIPs, Kooperations-Reminder, heutige Bestellungen und Reservierungen
- Kalender fuer VIP-Ablauf, Kooperations-Reminder, Bestellungen, Reservierungen und Events
- Tabs fuer VIPs, Kooperationen, Bestellungen, Reservierungen und Archiv
- Schnellbuttons fuer Status und VIP-Verlaengerung
- lokaler Passwortschutz

## Zugaenge

- Admin: `ChinaSantiNRW` - darf anlegen, bearbeiten und loeschen
- Manager: `ManagerNRWChina` - darf anlegen und bearbeiten, aber nicht loeschen
- Mitarbeiter: `NRWChinaMitarbeiter` - darf nur neue Eintraege anlegen

## Supabase Setup

1. In Supabase ein neues Projekt anlegen.
2. Die Datei [supabase-schema.sql](./supabase-schema.sql) im SQL Editor ausfuehren.
3. In Vercel fuer das Projekt diese Environment Variables setzen:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
4. Danach in Vercel neu deployen.

Die App holt sich die Werte ueber [api/config.js](./api/config.js) und verbindet sich dann aus dem Browser mit Supabase.

## Lokal testen

Die Seite laeuft auch ohne Supabase im lokalen Cache-Modus. Einfach `index.html` oeffnen.

## Hosting

- Vercel fuer das statische Frontend
- Supabase fuer die gemeinsame Datenbank
