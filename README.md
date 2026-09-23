# Aktueller Update-Hinweis

Für ein bereits eingerichtetes Projekt zuerst [UPDATE-2026-09-23.md](UPDATE-2026-09-23.md) lesen. Das Update benötigt keine Neuinitialisierung. Die Anleitung unten beschreibt die ursprüngliche Ersteinrichtung. Der Update-Hinweis dokumentiert die neuen Rollen, Funktionen und Grenzen der Bildspeicherung.

# Bonanzbar – gemeinsame Webapp mit Anmeldung

Dieses Paket ist eine eigenständige Vercel-Version der bisherigen HTML-Testapp. Es enthält Frontend, serverseitige API, Datenbankschema und Einrichtung des ersten Master-Kontos. Es wurde noch nicht auf bbdrinks.vercel.app installiert. Vorhandene Daten dieser Website oder der lokalen Testdatei werden nicht automatisch übernommen. Vor einem Austausch das bestehende Projekt und seine Daten sichern.

## Was enthalten ist

- Gemeinsame PostgreSQL-Datenbank über Supabase; der Browser speichert keine Geschäftsdaten mehr lokal.
- Anmeldung mit E-Mail und Passwort, Passwort festlegen/vergessen über E-Mail-Link, Abmelden.
- Mitglieder werden vom Master angelegt, keine öffentliche Registrierung.
- Rechte auf dem Server: Crew, Admin, Master. Master hat alle Admin-Rechte plus Mitglieder/Rollen, Belege, Abrechnung, Umlagen, Korrekturen und Reset.
- Gemeinsame Einkaufsliste, Bestandsschnappschüsse, persönliche Getränkestriche, Veranstaltungen, Notizen, Dienstbewerbungen und Bestellungen.
- Aktualisierung der Ansicht alle 30 Sekunden und nach eigenen Änderungen. Gleichzeitige Schreibvorgänge werden mit Versionsprüfung und Wiederholungen verarbeitet.
- Homepage-Abruf über den Server; ein Admin prüft die Vorschau und übernimmt die Termine. Noch kein automatischer täglicher Import.
- Animierter Totenkopf, Logo und mobile Oberfläche.

## Einrichtung – für die Person mit Vercel-Zugriff

### 1. Supabase vorbereiten

1. Ein eigenes Supabase-Projekt für die Bonanzbar erstellen, vorzugsweise in passender EU-Region.
2. Im SQL Editor die Datei `schema.sql` vollständig ausführen.
3. Unter Authentication die öffentliche Benutzerregistrierung deaktivieren (Allow new users to sign up AUS). E-Mail-/Passwort-Anmeldung aktivieren. Die API legt Konten ausschließlich über die geschützte Admin-Schnittstelle an.
4. Site URL auf `https://bbdrinks.vercel.app` setzen. Dieselbe Adresse als zulässige Weiterleitungsadresse ergänzen. Bei einer späteren Domainänderung auch diese Einstellungen anpassen.
5. Eigenen SMTP-Versand einrichten und einen echten Passwort-Reset testen. Supabases Standardversand ist für Tests eingeschränkt und reicht nicht als Mitglieder-Maildienst. SMTP-Anmeldedaten nur im Supabase-Dashboard eintragen.
6. Unter Email Templates → Reset Password den Link so setzen:

```html
<h2>Bonanzbar – Passwort festlegen</h2>
<p>Öffne diesen Link, um dein Passwort festzulegen oder zu ändern:</p>
<p><a href="{{ .SiteURL }}/?token_hash={{ .TokenHash }}&amp;type=recovery">Passwort festlegen</a></p>
<p>Wenn du das nicht angefordert hast, ignoriere diese E-Mail.</p>
```

Die App entfernt den Hash sofort aus der Adresszeile. Erst ein Klick auf „Link bestätigen“ verbraucht den einmaligen Link; automatische Mail-Link-Vorschauen lösen keine Bestätigung aus.

### 2. Server-Einstellungen in Vercel

Projektdateien in das vorhandene Git-Projekt übernehmen oder in ein neues privates Repository laden und dieses mit Vercel verbinden. **Nicht nur `dist` oder eine HTML-Datei hochladen:** die Verzeichnisse `api` und `server` werden ebenfalls benötigt.

Vercel-Projekteinstellungen:

- Framework: Other (die beiliegende `vercel.json` konfiguriert Build und Ausgabe).
- Node.js: 22 oder neuer.
- Install Command: `npm install`.
- Build Command: `npm run build`.
- Output Directory: `dist`.
- Root Directory: der entpackte Projektordner, in dem `package.json` liegt.

Environment Variables für Production:

| Name | Wert |
| --- | --- |
| `SUPABASE_URL` | Projekt-URL aus Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-Service-Role-Schlüssel aus Supabase |
| `APP_ORIGIN` | `https://bbdrinks.vercel.app` ohne abschließenden Schrägstrich |

Den Service-Role-Schlüssel niemals mit `VITE_` oder `NEXT_PUBLIC_` kennzeichnen, in den Browser einbauen, ins Repository schreiben oder per Chat verschicken. Die App liest ihn ausschließlich in Vercel Functions. Preview-Deployments sollten eine separate Testdatenbank und ihre eigene APP_ORIGIN nutzen.

### 3. Erstes Master-Konto einmalig anlegen

Auf dem Rechner der technischen Betreuung mit Node.js 22+ im Projektordner:

1. `.env.example` als `.env.local` kopieren.
2. Dieselben drei Werte wie in Vercel eintragen; zusätzlich `MASTER_EMAIL` und `MASTER_NAME` ausfüllen.
3. Ausführen:

```sh
npm install
npm test
npm run build
npm run bootstrap
```

Das Skript erzeugt das Master-Konto mit einem zufälligen, nicht ausgegebenen Passwort und initialisiert die App-Daten. Es verweigert eine erneute Initialisierung bei vorhandenen Daten. Echte Getränke und Preise legt der Master anschließend selbst an; Beispielgetränke werden nicht automatisch erzeugt.

Danach Vercel deployen und in der App „Passwort festlegen / vergessen“ wählen. Nach Empfang des Links eigenes Passwort mit mindestens 12 Zeichen setzen und anmelden.

### 4. Mitglieder hinzufügen

Zahnrad → Master → Mitgliederverwaltung. Name, E-Mail und Rolle eingeben. Das Mitglied öffnet die App und fordert über „Passwort festlegen / vergessen“ selbst seinen Link an. Es wird beim Anlegen noch keine E-Mail automatisch versendet.

Namen und Rollen sind in der App änderbar. Bestehende E-Mail-Adressen sind bewusst schreibgeschützt: Die technische Betreuung muss Änderungen sowohl am Supabase-Auth-Benutzer als auch am passenden `members`-Eintrag in `app_state.state` durchführen. Die UUID muss gleich bleiben. Den letzten Master kann die App nicht herabstufen.

## Abnahme vor Freigabe für alle

Mit zwei eigenen Testkonten und zwei getrennten Browsern testen:

1. Passwort-Mail kommt an; Link bestätigt; Passwort gesetzt; Login und Logout funktionieren; abgelaufener Link wird abgewiesen.
2. Ein Konto legt einen Einkauf an, das andere sieht ihn spätestens nach 30 Sekunden. Crew darf ihn nicht erledigen, Admin/Master darf es.
3. Parallel Getränkestriche setzen; beide müssen erhalten bleiben. Crew sieht nur eigene Striche.
4. Bewerben mit Dienst, Admin bestätigt; Mitglied sieht die Zusage.
5. Master verteilt Kosten und schließt einen Testbeleg ab; Admin ohne Master-Rolle hat darauf keinen Zugriff.
6. Neue Mitglieder können ihren Passwort-Link erhalten. Rollenwechsel wird bei der nächsten Anfrage wirksam.
7. Datenbanksicherung anlegen und Wiederherstellung auf einer getrennten Testdatenbank erproben. Reset nur dort testen.

## Speicherung, Sicherung und Grenzen

Für die Vereinsgröße liegen die Geschäftsdaten als gemeinsames JSON-Dokument in einer PostgreSQL-Zeile mit Revisionsnummer. Jede Änderung wird atomar mit Versionsvergleich geschrieben. Nicht mehr aktuelle Änderungen werden erneut auf den neuesten Stand angewendet; wiederholte identische Anfragen werden erkannt. Mitgliedschaft und Rollen werden bei jeder Anfrage serverseitig geprüft. RLS und fehlende Berechtigungen sperren direkten Zugriff für Browserrollen. Auth-Benutzer liegen getrennt im Supabase-Auth-System.

Dieses einfache Modell ist für eine kleine Crew ausgelegt. Mit wachsender Historie steigen Übertragungsmenge und Schreibkonflikte; dann in einzelne Tabellen migrieren. Anfragekennungen werden zur Erkennung von Wiederholungen mitgespeichert. Die Datenbank ist die gemeinsame Quelle, nicht der Browser.

Bestandsaufnahmen und bezahlte Belege sind in der normalen App nicht bearbeitbar. Der ausdrücklich gewünschte Master-Reset löscht jedoch auch diese Archive; Mitgliedskonten und Rollen bleiben erhalten. Dies ist kein revisionssicheres Buchhaltungssystem. Datenbankadministratoren können technisch Daten verändern. Vor Reset eine Sicherung über Supabase/PostgreSQL erstellen.

Ein Fehler zwischen Auth-Kontoerstellung und Speicherung des Mitglieds kann ein noch nicht freigeschaltetes Auth-Konto hinterlassen. Erneutes Anlegen mit derselben E-Mail verwendet dieses Konto wieder. Ohne Mitgliedseintrag bekommt es keinen Zugriff auf Geschäftsdaten.

Alte lokale Testdaten werden nicht importiert, damit keine Testrollen oder falschen Zuordnungen als echte Konten übernommen werden. Falls reale Daten übernommen werden sollen, ist ein gesonderter Import mit Zuordnung der Mitglieder-UUIDs notwendig.

## Prüfergebnis dieses Pakets

Produktions-Build und vier automatisierte Tests bestanden: Rollen/letzter Master, Abrechnung und Reset, simulierte konkurrierende Schreibvorgänge und Wiederholungen, Authentifizierung/Origin-Prüfung und sichere Sitzungscookies. API-Tests verwenden simulierte Supabase-Antworten. Echter SMTP-Versand, SQL-Ausführung in Supabase, Vercel-Deployment und End-to-End-Browsertest stehen bis zur Einrichtung des Zielprojekts aus.

## Offizielle Dokumentation

- https://supabase.com/docs/guides/auth/passwords
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/guides/auth/auth-email-templates
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://vercel.com/docs/functions
