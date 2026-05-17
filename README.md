# China Town VIP & Kooperation Control

Statische Website für VIPs und Kooperationen im China Town Control. Bestellungen und Tischreservierungen sind als zusätzliche operative Module enthalten. Die App kann lokal im Browser laufen, oder zentral mit Supabase für alle Geräte.

## Funktionen

- VIP Kunden mit Silber- oder Gold-Paket
- VIP Laufzeit in Monaten
- 4 Abhol-Sterne pro VIP-Monat
- Kooperationen mit Codewort, Vorteilen und Reminder
- Bestellungen mit Inhalt, Zeit und Betrag
- Tischreservierungen mit Zeit, Personen, Tisch und Anlass
- Events mit Uhrzeit, Ort und Details
- Rollen: Admin, Manager und Mitarbeiter
- Heute-Tab für fällige VIPs, Kooperations-Reminder, heutige Bestellungen und Reservierungen
- Kalender für VIP-Ablauf, Kooperations-Reminder, Bestellungen, Reservierungen und Events
- Tabs für VIPs, Kooperationen, Bestellungen, Reservierungen und Archiv
- Schnellbuttons für Status und VIP-Verlängerung
- lokaler Passwortschutz

## Zugänge

- Admin: `ChinaSantiNRW` - darf anlegen, bearbeiten und löschen
- Manager: `ManagerNRWChina` - darf anlegen und bearbeiten, aber nicht löschen
- Mitarbeiter: `NRWChinaMitarbeiter` - darf nur neue Einträge anlegen

## Supabase Setup

1. In Supabase ein neues Projekt anlegen.
2. Die Datei [supabase-schema.sql](./supabase-schema.sql) im SQL Editor ausführen.
3. In Vercel für das Projekt diese Environment Variables setzen:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
4. Danach in Vercel neu deployen.

Die App holt sich die Werte über [api/config.js](./api/config.js) und verbindet sich dann aus dem Browser mit Supabase.

## Lokal testen

Die Seite läuft auch ohne Supabase im lokalen Cache-Modus. Einfach `index.html` öffnen.

## Hosting

- Vercel für das statische Frontend
- Supabase für die gemeinsame Datenbank
