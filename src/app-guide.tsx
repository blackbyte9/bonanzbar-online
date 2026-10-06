const roles:any={guest:'Gäste',member:'Mitglieder',crew:'Crew',admin:'Admin',master:'Master'};
export function guideEntries(data:any){
 const role=data.role,admin=['admin','master'].includes(role),master=role==='master',staff=['crew','admin','master'].includes(role),member=role==='member',f=data.features||{};
 const rows:any[]=[];const add=(title:string,text:string,enabled=true)=>{if(enabled)rows.push({title,text})};
 add('Startseite & Navigation','Die Kacheln öffnen die einzelnen Bereiche. „Als nächstes in der Bonanzbar“ zeigt den nächsten Termin mit den hinterlegten Bildern und Links.');
 add('Veranstaltungen','Kommende Veranstaltungen ansehen: Datum, Uhrzeit, Bandinfos, Bilder, Homepage, YouTube und Tickets, sofern hinterlegt.');
 add('Infos & neue Nachrichten','Hier stehen die für deine Rolle veröffentlichten Hinweise. Neue Infos erscheinen farbig auf der Startseite. Beim Öffnen des Info-Bereichs werden sie für dein Konto als gelesen markiert.');
 add('Getränkekarte','Getränke und Verkaufspreise ansehen. Hier werden keine Getränkestriche gebucht.',role==='guest'||member);
 add('Rent a Bar','Termin mit Datum, Notiz und optionaler Handynummer anfragen. Mit angegebener Nummer kann das Team dich per WhatsApp kontaktieren. Den Status deiner Anfrage kannst du verfolgen.',role==='guest');
 add('Bonanzbar Veranstaltungskalender','Veranstaltungen und Vermietungen ansehen: Veranstaltungen rot, Anfragen blau, bestätigte Vermietungen grün. Du kannst selbst einen Termin anfragen.',role!=='guest');
 add('Drinklist & Korrekturen','Für dein Getränk einen Strich hinzufügen. Eine versehentliche Buchung kannst du über die angebotene Rückgängig-Funktion zurücknehmen. Über „Korrektur“ sendest du eine Nachricht an Master. Ausgeblendete Getränke mit offenen Strichen bleiben zur Kontrolle sichtbar.',role!=='guest'&&f.drinks!==false);
 add('Einkaufsliste','Artikel auswählen oder frei eintragen und die benötigte Menge angeben.'+(admin?' Erledigte Einkäufe kannst du abhaken.':' Nur Admin und Master können Einkäufe als erledigt markieren.'),staff&&f.shopping!==false);
 add('Dienste & Bewerbungen','Bei einer Veranstaltung einen Dienst wählen: Theke, Parkplatz, Ton, Licht, Eintritt oder Joker. Admin oder Master entscheidet über die Bewerbung. Bestätigte Einsätze findest du bei den Veranstaltungen; sie gelten für deren Datum.',staff&&f.staffing!==false);
 add('Todo’s','Aufgaben und Hinweise erfassen, eine zuständige Person wählen, Dringlichkeit festlegen und den Bearbeitungsstatus aktualisieren.',staff&&!!f.todos);
 add('Social Wall','Bilder und Kommentare mit der Gemeinschaft teilen. Eigene Beiträge können gelöscht werden; Admin und Master können moderieren.',!!f.wall);
 add('Konzertrückblicke','Veröffentlichte Rückblicke mit Fotos und Texten über den Rückblick-Button bei Veranstaltungen ansehen.',!!f.recaps);
 add('Spezial des Tages','Ein hinterlegtes Tagesangebot erscheint am passenden Tag in der Gästeansicht.',(role==='guest'||member)&&!!f.special);
 if(admin){
 add('Admin-Aufgabenübersicht','Über Admin in der unteren Leiste gelangst du immer zur Aufgabenübersicht. Die Kacheln öffnen die einzelnen Verwaltungsaufgaben.');
 add('Bandinfos & Veranstaltungsdetails','Bandtexte, Homepage, YouTube und Bilder pflegen. Bilder als JPEG, PNG oder WebP bis 3 MB hochladen. Termine zusätzlich zur Homepage-Übernahme manuell anlegen; sie werden nach Datum sortiert.');
 add('Mietanfragen bearbeiten','Vermietungen mit Kontakt, Zeitraum und Notizen verwalten und ihren Status ändern. Solange eine Anfrage offen ist, leuchtet die Kalenderkachel für Admin und Master rot. Über die Handynummer kann WhatsApp geöffnet werden.');
 add('Personalbedarf & Bewerbungen verwalten','Je Veranstaltung den Bedarf pro Dienst festlegen und offene Bewerbungen bestätigen oder ablehnen. Die Besetzung zeigt, wo noch Helfer fehlen.',f.staffing!==false);
 add('Inventar & Artikel','Getränke und Einkaufsartikel anlegen, bearbeiten oder deaktivieren. Gebindegröße, Einkaufspreis, Crewpreis und Verkaufspreis pflegen. Für jeden Artikel Getränkekarte, Drinklist und Einkaufsliste einzeln freischalten.');
 add('Inventarliste importieren','Eine vorbereitete JSON-Datei laden, Artikel, Preise und Sichtbarkeit prüfen und übernehmen. Gleiche Namen werden zunächst übersprungen; die Aktualisierung vorhandener Artikel muss ausdrücklich ausgewählt werden.');
 add('Bestand erfassen','Zuerst Bier und Softdrinks, dann Schnaps und Longdrinks sowie Wein und Sekt, darunter sonstige Artikel zählen. Gebinde und volle Einheiten erfassen. Bei aktivierter Restflasche den Füllstand einer angebrochenen 0,7-l-Flasche ergänzen. „Fertig“ speichert eine unveränderliche Inventur; nicht ausgefüllte Mengen zählen als 0.',f.stock!==false);
 add('Bestandsarchiv','Frühere Inventuren ansehen und als CSV herunterladen. Eine neue Inventur ersetzt keine früheren Aufnahmen.',f.stock!==false);
 add('Bestellungen','Gewünschte Gebinde und Flaschen eintragen, Bestellung mit Datum speichern und eine WhatsApp-Nachricht vorbereiten. Du wählst den Empfänger selbst. Frühere Bestellungen stehen im Archiv.');
 add('Mitgliederverwaltung','Namen, E-Mail-Adressen und Konten verwalten. Normale Konten können deaktiviert und wieder aktiviert werden.'+(master?' Du vergibst außerdem Rollen und kannst Admin-Konten deaktivieren.':' Rollen vergibt ausschließlich Master.'));
 add('Infos veröffentlichen','Dauerhafte oder aktuelle Informationen erstellen und die Zielgruppe wählen: Gäste, Mitglieder, Crew, Crew & Mitglieder oder alle. Hinweise können bearbeitet und gelöscht werden.');
 add('Rückblicke & Tagesangebot pflegen','Konzertrückblicke mit Text und Bildern erstellen und veröffentlichen. Unter Inventar das Spezial des Tages mit Datum, Beschreibung und Preis pflegen. Die Freischaltung für andere Rollen steuert Master.');
 add('Ansicht wechseln','Die App aus Sicht anderer Rollen ansehen. Änderungen sind in dieser Vorschau deaktiviert.');
 }
 if(master){
 add('Rollen & Freigabe','Neue Registrierungen starten als Gast. Du vergibst Gast, Mitglied, Crew, Admin oder Master. Deine eigene Master-Rolle kannst du nicht auf Admin herabsetzen.');
 add('Dienste manuell eintragen','Unter „Offene Bewerbungen“ Veranstaltung, aktives Crew- oder Admin-Konto und Dienst wählen. Der Einsatz ist direkt bestätigt. Eine vorhandene offene Bewerbung wird bestätigt; doppelte bestätigte Einsätze werden verhindert.');
 add('Mitgliedskonten · Soll & Haben','Offene Getränkestriche, Belastungen und Guthaben prüfen. Manuelle Gutschriften oder Belastungen mit Begründung buchen. Beim Abrechnen werden offene Getränke mit dem Konto verrechnet; der verbleibende Saldo bleibt für später erhalten.');
 add('Helfergutschriften','Die Vergütung je Dienst in der Buchhaltung einstellen. Bestätigte, geleistete Einsätze dort zur Gutschrift übernehmen. Eine Diensteinteilung allein erzeugt noch keine Gutschrift. Bereits gebuchte Gutschriften behalten ihren Betrag.');
 add('Belege & Korrekturanfragen','Abrechnungsbelege herunterladen, Getränkekorrekturen prüfen und offene Striche mit Begründung korrigieren. Zahlungen und Abrechnungen im Mitgliedskonto erfassen.');
 add('Kostenumlagen','Einen Gesamtbetrag mit Verwendungszweck auf Crew, Admin und Master verteilen. Die Vorschau zeigt den Anteil je Konto vor dem Buchen. Mitglieder und Gäste werden bei neuen Umlagen nicht belastet.');
 add('Veranstaltungsabrechnung','Veranstaltung sowie Bestand davor und danach auswählen. Verbrauch = Anfangsbestand minus Endbestand inklusive Restflaschen. Verbrauch mal Flaschen-Einkaufspreis ergibt Getränkekosten. Einnahmen für Getränke, Tickets und Sonstiges ergänzen; Ergebnis als CSV und in der Gewinn-/Verlustgrafik ansehen. Nur Zeiträume ohne Nachlieferung dazwischen verwenden.');
 add('Einkaufspreise & Abschluss','Fehlende oder mit 0 gespeicherte Einkaufspreise werden, falls vorhanden, aus dem aktuellen Inventar ergänzt und gekennzeichnet. Verbrauch ohne Preis wird nicht kostenlos abgerechnet. Entwürfe neu speichern; ein Abschluss schreibt die Abrechnung fest. Helfergutschriften werden separat behandelt.');
 add('Weitere Veranstaltungsposten','In der manuellen Veranstaltungsabrechnung Einnahmen und Ausgaben wie Bandgage oder Technik erfassen, exportieren und abschließen. Diese Positionen werden getrennt von der Inventurabrechnung geführt.');
 add('Funktionen freischalten','Social Wall, Rückblicke, Todo’s und weitere optionale Bereiche schrittweise einschalten. Versteckte Bereiche behalten ihre gespeicherten Inhalte.');
 add('Inventar-Neustart aus CSV','Die einmalige vorbereitete CSV-Übernahme richtet die 54 Artikel ein und speichert einen Nullbestand. Nicht enthaltene Artikel werden deaktiviert. Historische Belege und offene Striche bleiben erhalten. Nur bei bewusst gewünschtem Neustart ausführen.');
 add('Zurücksetzen','Der vollständige Reset verlangt das Wort „reset“ und löscht die App-Fachdaten. Die Mitgliedskonten und Rollen bleiben erhalten. Diese Funktion nur nach sorgfältiger Prüfung verwenden.');
 }
 add('Anmeldung & Passwort','Mit deiner E-Mail-Adresse und deinem Passwort anmelden. Neue Registrierungen müssen ihre E-Mail bestätigen. Über „Passwort vergessen“ kannst du einen Link zum Zurücksetzen anfordern.');
 return rows;
}
export default function AppGuide({data}:any){return <details className="panel app-guide" key={data.role}><summary><strong>App-Anleitung · {roles[data.role]||'Dein Bereich'}</strong><span style={{display:'block'}}>Funktionen kurz erklärt · zum Öffnen antippen</span></summary><p>Diese Anleitung erklärt die Funktionen deiner Rolle. Optionale Bereiche erscheinen nur, wenn sie freigeschaltet sind.</p>{guideEntries(data).map(({title,text}:any)=><article key={title} style={{padding:'12px 0',borderBottom:'1px solid #806650'}}><h3>{title}</h3><p>{text}</p></article>)}</details>}
