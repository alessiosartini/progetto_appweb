//riferimenti ai contenitori principali della spa presenti in index.html
const appEl = document.getElementById("app");
const userBarEl = document.getElementById("user-bar");

//funzione per ottenere e ricovertire in un oggetto json l'utente salvato in localStorage, se presente. Se non c'è nessun utente salvato,
//  restituisce null
function getUtenteSalvato() {
  const riga = sessionStorage.getItem("utente");
  return riga ? JSON.parse(riga) : null;
}

//aggiorna la barra superiore con nome e ruolo e pulsante di logout se l'utente è loggato, altrimenti la svuota.
function aggiornaUserBar(utente) {
  //se non c'è un utente autenticato, svuota la barra superiore e termina la funzione
  if (!utente) {
    userBarEl.innerHTML = "";
    return;
  }

  //mostra i dati dell'utente loggato e un pulsante di logout. quando l'utente clicca su logout, rimuove l'utente da localStorage
  // e aggiorna la vista della spa.
  userBarEl.innerHTML = `
    <span>Ciao, <strong>${utente.nome}</strong> (${utente.ruolo})</span>
    <button id="btn-logout" type="button">Logout</button>
    `;

  //registra il click sul pulsante logout per rimuovere l'utente da localStorage e aggiornare la vista della spa
  document.getElementById("btn-logout").addEventListener("click", () => {
    sessionStorage.removeItem("utente");
    renderVista();
  });
}

//renderizza la vista di login e gestisce l'invio delle credenziali all'endpoint /api/login.
// Se le credenziali sono corrette, salva l'utente in localStorage e aggiorna la vista della spa.
function renderLogin() {
  //assicura che la barra sia vuota durante la schermata di login
  aggiornaUserBar(null);

  //inserisce l'HTML del form di login dentro il contenitore #app
  appEl.innerHTML = `
    <section class="login-box">
    <h1>Accedi al sistema</h1>
    <form id="login-form">
        <label for="email">Email:</label>
        <input id="email" name="email" type="email" required placeholder="studente@uni.it">

        <label for="pw">Password:</label>
        <input id="pw" name="pw" type="password" required placeholder="••••••••">

        <button type="submit">Accedi</button>
    </form>
    <p id="login-msg"></p>
</section>
`;

  const form = document.getElementById("login-form");
  const msgEl = document.getElementById("login-msg");

  //gestisce il submit del form in modo asincrono senza dover ricaricare la pag
  form.addEventListener("submit", async (e) => {
    //blocca il comportamento predefinito di invio/ricaricamento del browser
    e.preventDefault();
    msgEl.textContent = "Accesso in corso...";

    //legge i val inseriti dall'ut nei campi email e pw
    const email = document.getElementById("email").value.trim();
    const pw = document.getElementById("pw").value;

    try {
      //invia la richiesta post ad /api/login con payload JSON {email, pw}
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pw }),
      });

      //converte la risposta JSON del server in oggetto js
      const data = await res.json();

      //se lo stato http non è ok mostra il mess di err
      if (!res.ok) {
        msgEl.textContent = data.messaggio || "Errore durante il login.";
        return;
      }

      //login riuscito: salva l'ut in localStorage e aggiorna la vista della spa
      sessionStorage.setItem("utente", JSON.stringify(data.utente));
      renderVista();
    } catch (err) {
      //gestisce eventuali errori di rete o di conn al server
      console.error("Errore fetch login", err);
      msgEl.textContent = "Impossibile contattare il server.";
    }
  });
}

// Restituisce la data locale odierna nel formato "YYYY-MM-DD" per l'attributo min di <input type="date">
function getDataOggiLocale() {
  const oggi = new Date();
  const anno = oggi.getFullYear();
  const mese = String(oggi.getMonth() + 1).padStart(2, "0");
  const giorno = String(oggi.getDate()).padStart(2, "0");
  return `${anno}-${mese}-${giorno}`;
}

// Renderizza l'area principale riservata all'utente autenticato, le aule, il form e le prenotazioni
function renderAreaPrincipale(utente) {
  // Mostra nome, ruolo e tasto Logout nella barra superiore
  aggiornaUserBar(utente);

  // Popola il contenitore principale #app con aule, form di prenotazione e lista prenotazioni
  appEl.innerHTML = `
    <section>
      <h1>Aule studio disponibili</h1>
      <p>Utente collegato: <strong>${utente.email}</strong></p>
      <div id="aule-container">Caricamento aule...</div>
    </section>

    <section>
      <h2>Nuova prenotazione</h2>
      <form id="prenotazione-form">
        <label for="aula-select">Aula</label>
        <select id="aula-select" name="aula_id" required>
          <option value="">Caricamento aule...</option>
        </select>

        <label for="data-prenotazione">Data</label>
        <input id="data-prenotazione" name="data_prenotazione" type="date" required>

        <label for="fascia-oraria">Fascia oraria</label>
        <select id="fascia-oraria" name="fascia_oraria" required>
          <option value="09:00 - 13:00">09:00 - 13:00</option>
          <option value="14:00 - 18:00">14:00 - 18:00</option>
          <option value="18:00 - 21:00">18:00 - 21:00</option>
        </select>

        <button type="submit">Prenota aula</button>
      </form>
      <p id="prenotazione-msg"></p>
    </section>

    <section>
      <h2>Prenotazioni registrate</h2>
      <div id="prenotazioni-container">Caricamento prenotazioni...</div>
    </section>
  `;

  // Imposta la data minima consentita sul campo data del form
  const inputData = document.getElementById("data-prenotazione");
  if (inputData) {
    inputData.min = getDataOggiLocale();
  }

  // Carica le aule (e popola la select), collega l'invio del form e carica le prenotazioni
  caricaAule();
  configuraFormPrenotazione(utente);
  caricaPrenotazioni(utente);
}

// Recupera l'elenco delle aule tramite GET /api/aule e aggiorna sia la lista sia la <select>
async function caricaAule() {
  const container = document.getElementById("aule-container");
  const selectEl = document.getElementById("aula-select");

  try {
    const res = await fetch("/api/aule");
    const aule = await res.json();

    if (!Array.isArray(aule) || aule.length === 0) {
      container.innerHTML = "<p>Nessuna aula disponibile.</p>";
      if (selectEl) {
        selectEl.innerHTML =
          '<option value="">Nessuna aula disponibile</option>';
      }
      return;
    }

    // Lista delle aule studio
    container.innerHTML = `
      <ul>
        ${aule.map((a) => `<li><strong>${a.nome}</strong> — Capienza: ${a.capienza} — ${a.ubicazione}</li>`).join("")}
      </ul>
    `;

    // Popola la tendina di selezione aule nel form di prenotazione
    if (selectEl) {
      selectEl.innerHTML = `
        <option value="">Seleziona un'aula</option>
        ${aule.map((a) => `<option value="${a.id}">${a.nome} (${a.ubicazione})</option>`).join("")}
      `;
    }
  } catch (err) {
    console.error("Errore caricamento aule:", err);
    container.innerHTML = "<p>Errore nel recupero delle aule.</p>";
    if (selectEl) {
      selectEl.innerHTML = '<option value="">Errore caricamento aule</option>';
    }
  }
}

// Gestisce l'invio del form di prenotazione verso POST /api/prenotazioni
function configuraFormPrenotazione(utente) {
  const form = document.getElementById("prenotazione-form");
  const msgEl = document.getElementById("prenotazione-msg");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msgEl.textContent = "Salvataggio prenotazione...";

    // Recupera i valori dal form e l'email dell'utente attualmente loggato
    const aula_id = document.getElementById("aula-select").value;
    const data_prenotazione =
      document.getElementById("data-prenotazione").value;
    const fascia_oraria = document.getElementById("fascia-oraria").value;

    try {
      const res = await fetch("/api/prenotazioni", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          utente_email: utente.email,
          aula_id,
          data_prenotazione,
          fascia_oraria,
        }),
      });

      const data = await res.json();

      // Mostra eventuale messaggio di errore (es. 400 campi mancanti o 409 slot già occupato)
      if (!res.ok) {
        msgEl.textContent =
          data.errore || "Impossibile completare la prenotazione.";
        return;
      }

      msgEl.textContent = "Prenotazione confermata!";
      form.reset();
      // Ricarica la lista delle prenotazioni per mostrare subito la nuova voce
      caricaPrenotazioni(utente);
    } catch (err) {
      console.error("Errore invio prenotazione:", err);
      msgEl.textContent = "Errore di connessione al server.";
    }
  });
}

// Recupera le prenotazioni da GET /api/prenotazioni, mostra l'email reale e il pulsante
// "Annulla" solo per le prenotazioni dell'utente loggato (solo studenti)
async function caricaPrenotazioni(utente) {
  const container = document.getElementById("prenotazioni-container");

  try {
    // Richiede l'elenco completo delle prenotazioni al backend
    const res = await fetch("/api/prenotazioni");
    const prenotazioni = await res.json();

    // Se non ci sono prenotazioni o la risposta non è un array, mostra un messaggio dedicato
    if (!Array.isArray(prenotazioni) || prenotazioni.length === 0) {
      container.innerHTML = "<p>Nessuna prenotazione presente.</p>";
      return;
    }

    // Formatta la data in modo leggibile (YYYY-MM-DD) e costruisce la lista HTML
    container.innerHTML = `
      <ul>
        ${prenotazioni
          .map((p) => {
            const dataFormattata = String(p.data_prenotazione).slice(0, 10);

            // Vero solo se la prenotazione appartiene all'utente attualmente loggato
            const eProprietario = p.utente_email === utente.email;

            // Nasconde l'email degli altri studenti per tutela della privacy
            const etichettaUtente = eProprietario
              ? p.utente_email
              : "Altro studente";

            return `
              <li>
                <strong>${p.aula_nome}</strong> — Data: ${dataFormattata} — Fascia: ${p.fascia_oraria}
                (Utente: ${etichettaUtente})
                ${
                  eProprietario
                    ? `<button type="button" class="btn-annulla" data-id="${p.id}">Annulla</button>`
                    : ""
                }
              </li>
            `;
          })
          .join("")}
      </ul>
    `;

    // Collega il listener di click solo ai pulsanti "Annulla" renderizzati
    container.querySelectorAll(".btn-annulla").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");

        try {
          // Invia l'email dell'utente loggato così il server verifica che sia il proprietario
          const delRes = await fetch(`/api/prenotazioni/${id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              utente_email: utente.email,
            }),
          });

          if (delRes.ok) {
            // Ricarica la lista dopo l'annullamento riuscito
            caricaPrenotazioni(utente);
          } else {
            // Mostra l'eventuale errore restituito dal server (es. 403 o 404)
            const errData = await delRes.json();
            alert(errData.errore || "Errore durante l'annullamento.");
          }
        } catch (err) {
          console.error("Errore eliminazione prenotazione:", err);
          alert("Errore di connessione al server.");
        }
      });
    });
  } catch (err) {
    console.error("Errore caricamento prenotazioni:", err);
    container.innerHTML = "<p>Errore nel recupero delle prenotazioni.</p>";
  }
}

function renderVista() {
  const utente = getUtenteSalvato();
  if (utente) {
    renderAreaPrincipale(utente);
  } else {
    renderLogin();
  }
}

renderVista();
