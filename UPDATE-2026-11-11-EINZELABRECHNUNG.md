# Einzelabrechnung mit Belegen direkt unter dem Namen

Aufruf: **Admin → Drinklist-Abrechnung → Abrechnen & Belege**. Dieser Bereich ist nur für Master zugänglich. Die Einzelabrechnung befindet sich außerhalb der Buchhaltung.

Eine Person über die Namenssuche finden und ihren Namen öffnen. Jeder Eintrag zeigt den Kontosaldo, die offene Drinklist, die Anzahl gespeicherter Abrechnungen und einen persönlichen Button „[Name] einzeln abrechnen“. Vor dem Abschluss werden ausschließlich die offenen Positionen dieser Person bestätigt und mit ihrem Konto verrechnet.

Unter dem Namen steht dauerhaft „Bisherige Abrechnungen von [Name]“. Jede Abrechnung zeigt Datum und Uhrzeit, die abrechnende Person, den abgerechneten Betrag, den Kontosaldo davor, den Übertrag danach und die einzelnen abgerechneten Positionen. Ein CSV-Beleg kann jederzeit erneut heruntergeladen werden. Diese Historie bleibt sichtbar, wenn die offene Drinklist leer ist oder später neue Striche hinzukommen.

Die Belege werden anhand der eindeutigen Kontokennung zugeordnet. Namensänderungen und identische Namen verschiedener Mitglieder führen dadurch nicht zu einer Vermischung. Auch ältere Getränkebelege mit einer Kontokennung erscheinen direkt bei der zugehörigen Person. Etwaige alte Belege ohne vorhandenes Mitgliedskonto bleiben gesondert zugänglich und werden nicht anhand des Namens geraten.

Zahlungen, manuelle Kontokorrekturen und Kontobewegungen lassen sich unter der jeweiligen Person gesondert öffnen. Eine Drinklist-Abrechnung bestätigt keine Barzahlung. Neue Zahlungen ändern die gespeicherten Werte früherer Belege nicht.

Helfergutschriften, Umlagen sowie Veranstaltungs- und Zwischenabrechnungen bleiben in der Buchhaltung. Die Wochenübersicht bleibt im eigenen Bereich Drinklist-Abrechnung verfügbar.

## Testversion

Bonanzbar-Test-Einzelabrechnung-2026-11-11.html im Browser öffnen. Master wählen, dann Admin → Drinklist-Abrechnung → Abrechnen & Belege. Bei Alex und Sam sind bereits Beispielbelege hinterlegt. Alex einzeln abrechnen: Die anderen offenen Drinklisten bleiben unverändert; unter Alex erscheint anschließend ein weiterer Beleg. Nach dem Neuladen bleiben die lokalen Testbelege erhalten. Falls alte Beispieldaten angezeigt werden, ausschließlich in der HTML-Testversion „Beispieldaten neu laden“ verwenden.

Die HTML-Testversion nutzt lokale Beispieldaten und hat keine Verbindung zur produktiven App.

## Installation und Prüfung

Den Inhalt des Ordners bonanzbar-sept30 in das bestehende Projekt übernehmen und regulär bereitstellen. Bestehende Vercel-/Supabase-Einstellungen beibehalten. Für dieses Update ist keine Datenbankmigration und kein Zurücksetzen erforderlich. Es wurde nicht automatisch veröffentlicht.

Neun gezielte Tests für Einzelabrechnung, unveränderte historische Belege nach weiteren Abrechnungen und Zahlungen, sichere Zuordnung nach Kontokennung, Anzeige bei leerer Drinklist, Master-Berechtigungen und die bestehende Wochenübersicht erfolgreich. Produktions-Build und HTML-Testversion erfolgreich erstellt.
