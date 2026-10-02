# Anmeldung und E-Mail-Links prüfen

Lokal geprüft mit simuliertem Auth-Server: Registrierung übermittelt normalisierte E-Mail und Passwort, Bestätigungs-Mail erneut senden, Passwort-Reset mit Rücksprungadresse, Token-Verifizierung, Passwortwechsel über authentifizierte Sitzung. Kein tatsächlicher Mailversand getestet.

Für die technische Betreuung:
1. In Vercel APP_ORIGIN auf https://bbdrinks.vercel.app setzen (oder die tatsächlich verwendete Domain). SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY und SUPABASE_ANON_KEY müssen zum selben Projekt gehören.
2. In Supabase Authentication die Site URL und erlaubten Redirect URLs auf die echte App-Adresse einstellen.
3. E-Mail-Bestätigung für Registrierung einschalten.
4. Die Dateien email-templates/confirm-signup.html und email-templates/reset-password.html in die entsprechenden Supabase-Mailvorlagen übernehmen. Die App verarbeitet token_hash mit type=email bzw. type=recovery. Standard-Mailvorlagen sind dafür nicht ausreichend. Dateien im GitHub-Repository ändern die Supabase-Vorlagen nicht automatisch.
5. SMTP-Absender und SMTP-Zugang konfigurieren und Zustellung testen. Supabase-Auth-Logs bei Fehlern prüfen. Keine Passwörter oder Service-Keys im Chat teilen.
6. Mit einer eigenen Testadresse registrieren, Mail öffnen, Link bestätigen und Gastzugang prüfen. Dann abmelden, Passwort vergessen anfordern, neuesten Link öffnen, neues Passwort speichern, abmelden und mit neuem Passwort anmelden. Wiederverwendung des alten Links muss fehlschlagen. Spamordner prüfen.

Normales Anmelden mit bestehendem Passwort verschickt keine E-Mail. Registrierung, Bestätigungs-Mail erneut senden und Passwort vergessen lösen E-Mails aus. Die HTML-Testversion simuliert Anmeldung und sendet keine E-Mails.

Quellen: https://supabase.com/docs/guides/auth/auth-email-templates und https://supabase.com/docs/guides/auth/redirect-urls
