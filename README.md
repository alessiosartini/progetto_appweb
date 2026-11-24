# Gestore Aule Studio

Applicazione web per la gestione e la prenotazione delle aule studio universitarie dedicata agli studenti, con autenticazione, consultazione delle aule, creazione e annullamento delle prenotazioni e tutela della privacy sulle email degli altri utenti.

## Panoramica
Il Gestore Aule Studio è una web application pensata per semplificare la vita quotidiana degli studenti universitari nella ricerca e prenotazione di un posto o di uno spazio in aula studio. Dopo aver effettuato l'accesso con il proprio account, lo studente può consultare rapidamente le aule disponibili e verificare quali fasce orarie risultano già occupate. Quando vuole riservare uno spazio per studiare, compila il form scegliendo aula, data e fascia oraria, mentre il sistema controlla che non ci siano sovrapposizioni.

## Funzionalità principali
- Effettuare il login e gestire la propria sessione.
- Consultare l'elenco delle aule studio disponibili.
- Prenotare un'aula per una data e una fascia oraria (con controllo lato server contro le sovrapposizioni).
- Visualizzare le prenotazioni registrate (mostrando la propria email e il tasto **Annulla** solo sulle proprie prenotazioni, mentre nasconde l'email degli altri studenti).
- Annullare una propria prenotazione con verifica lato server.

## Stack tecnologico
- **Frontend:** HTML5, CSS3, JavaScript (SPA in `public/`)
- **Backend:** Node.js, Express (`server.js`)
- **Database:** MySQL (`mysql2`)

## Struttura del repository
- `server.js` — Server Express, connessione al database MySQL ed endpoint REST API (`/api/login`, `/api/aule`, `/api/prenotazioni`)
- `public/` — Interfaccia web (`index.html`, `style.css`, `app.js`)
- `database.sql` — Script SQL per la creazione del database e delle tabelle
- `package.json` / `package-lock.json` — Dipendenze e configurazione del progetto Node.js
- `.gitignore` — File e cartelle esclusi dal versionamento (es. `node_modules/`)

## Installazione e avvio
1. Clona il repository e spostati nella cartella del progetto:
   ```bash
   git clone [https://github.com/alessiosartini/progetto_appweb.git](https://github.com/alessiosartini/progetto_appweb.git)
   cd progetto_appweb
