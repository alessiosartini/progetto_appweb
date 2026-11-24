# Gestore Aule Studio

<img width="1024" height="572" alt="immagine" src="https://github.com/user-attachments/assets/b8b75fd6-f50e-487b-bcb4-34a9005c38b1" />


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

## Architettura
L'applicazione adotta un'architettura **client-server a tre livelli** (Frontend, Backend REST API e Database relazionale) per garantire semplicità di manutenzione, chiara separazione delle responsabilità e scalabilità:

### Frontend
- **Single Page Application (SPA)** in HTML5, CSS3 e Vanilla JavaScript (servita staticamente dalla cartella `public/`):
  - **Gestione autenticazione e sessione:** form di login con salvataggio dello stato dell'utente autenticato in `localStorage` e funzione di logout.
  - **Interfaccia dinamica:** aggiornamento reattivo del DOM tramite richieste asincrone (`fetch`) verso le API del backend, senza ricaricamento della pagina.

### Backend
- **Server REST API** sviluppato in **Node.js** con framework **Express** (`server.js`):
  - **Middleware integrati:** gestione automatica del parsing JSON (`express.json()`) ed erogazione dei file statici del frontend (`express.static('public')`).
  - **Servizio Autenticazione (`POST /api/login`):** verifica delle credenziali utente sul database tramite query parametriche.
  - **Servizio Aule (`GET /api/aule`):** recupero dell'elenco completo delle aule studio disponibili.
  - **Servizio Prenotazioni (`GET`, `POST`, `DELETE /api/prenotazioni`):** lettura delle prenotazioni con `JOIN` sulle aule, controllo preventivo contro le sovrapposizioni (stato `409 Conflict`) e verifica lato server dell'identità del proprietario prima dell'eliminazione (stato `403 Forbidden`).

### Design e interfaccia (`public/style.css`)
- **Layout responsive:** impaginazione centrata con adattamento tramite media query (`max-width: 640px`) per la consultazione da desktop e smartphone.
- **Struttura a card e liste:** sezioni distinte per accesso, aule studio, form di prenotazione ed elenco delle prenotazioni registrate.
- **Stati visivi:** stili dedicati a pulsanti principali e di annullamento (`.btn-annulla`), focus sui campi e messaggi di stato o errore.

### Database
- **Database relazionale MySQL** (`db_aule_studio`) gestito tramite il driver `mysql2`:
  - **Tabella `utenti`:** anagrafica e credenziali degli studenti abilitati all'accesso.
  - **Tabella `aule`:** catalogo delle aule studio con capienza e ubicazione.
  - **Tabella `prenotazioni`:** registro delle prenotazioni collegate alle aule tramite chiave esterna (`FOREIGN KEY` su `aula_id` con `ON DELETE CASCADE`) e query parametriche (`?`) per prevenire SQL injection.
 
## Sviluppi futuri
- **Registrazione utenti dedicata (`POST /api/register`):** aggiunta di un flusso separato di registrazione per creare nuovi account nel database controllando l'univocità dell'email, mantenendo distinto il login (`POST /api/login`).
- **Sessioni e autenticazione lato server:** introduzione di una sessione sul backend (ad esempio tramite cookie/sessioni server o token) al posto del solo salvataggio dello stato utente sul browser (`sessionStorage`/`localStorage`), per rendere ancora più sicure le verifiche sui permessi di eliminazione (`DELETE /api/prenotazioni/:id`).
- **Gestione avanzata dei ruoli (`studente`, `docente`, `admin`):** estensione dei permessi per consentire a ruoli dedicati o amministratori una gestione più ampia delle prenotazioni o delle aule.
- **Gestione del catalogo aule e filtri:** possibilità di aggiungere/modificare aule direttamente dall'interfaccia o filtrare le disponibilità per aula, data o fascia oraria.
- **Configurazione tramite variabili d'ambiente (`.env`):** spostamento dei parametri di connessione al database MySQL e della porta del server in variabili d'ambiente per evitare credenziali cablate nel codice.

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
