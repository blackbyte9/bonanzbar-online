# Zahlungsstatus für Einzelabrechnungen

Nur Master: Drinklist-Abrechnung → Person einzeln abrechnen → Name → Bisherige Abrechnungen.

Einzelabrechnungen können nach tatsächlichem Geldfluss ausdrücklich als „Verrechnet / bezahlt“ bestätigt werden. Neue Zahlungseingänge werden im Konto gebucht; alternativ kann eine vorhandene Zahlung ohne erneute Buchung zugeordnet werden. Eine Zahlung ist nur einem Beleg zuordenbar. Betrag, Zahlungsdatum und Bestätigung bleiben im Beleg und CSV sichtbar. Die ursprünglichen Abrechnungswerte bleiben erhalten.

Die Bestätigung bedeutet, dass dieser Beleg vollständig erledigt ist. Teilzahlungen weiterhin über Kontobewegungen erfassen; nicht vorzeitig als vollständig verrechnet bestätigen. Vorhandene Helfergutschriften und Guthaben werden nicht gelöscht. Alte Belege ohne Kontobuchung bleiben unverändert.

Keine Datenmigration und kein Zurücksetzen erforderlich. Update im bestehenden Projekt bereitstellen. Die mitgelieferte HTML-Datei verwendet nur lokale Beispieldaten.

Geprüft: fünf gezielte Tests zu Einzelabrechnungen, Darstellung, Rollenprüfung, Kontozuordnung, Doppelbuchung und Wiederverwendung von Zahlungen; Produktionsbuild und HTML-Build erfolgreich.
