//importa express per creare il server web e gestire le rotte api
const express = require("express");
//importa mysql2 per collegare node.js al database mysql
const mysql = require("mysql2");

//Inizializza l'applicazione express e definisce la porta su cui il server ascolterà le richieste
const app = express();
const port = 3000;

//middleware: permette al server di leggere i dati in formato JSON inviati dal client nelle richieste (es POST, PUT)
app.use(express.json());
//middleware: rende accessibili al browser i file statici del frontend (html, css, js) presenti nella cartella public
app.use(express.static("public"));

//configura i parametri di connessione al database mysql locale
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "1234",
  database: "db_aule_studio",
  dateStrings: true,
});

//avvia la connessione al db e stampa un messaggio di conferma nel terminale in caso di successo o un messaggio di errore in caso di fallimento
db.connect((err) => {
  if (err) {
    console.error("Errore di connessione al database: ", err);
    return;
  }
  console.log("Connesso al database MySQL con successo");
});

//endpoint POST /api/login: verifica le credenziali dell'utente e restituisce un messaggio di successo o errore
app.post("/api/login", (req, res) => {
  //estrae email e password dal corpo della richiesta inviata dal frontend (client)
  const { email, pw } = req.body;
  //query per prevenire attacchi di tipo SQL injection, selezionando l'id, l'email e il ruolo dell'utente dal database se le credenziali corrispondono (no pw)
  const query =
    "SELECT id, nome, email, ruolo FROM utenti WHERE email = ? AND pw = ?";

  db.query(query, [email, pw], (err, results) => {
    //se c'è un errore lato db/query risponde con un messaggio di errore e codice 500 (Internal Server Error)
    if (err) return res.status(500).json({ errore: err.message });

    //se viene trovato almeno un utente corrispondente alle credenziali inviate, risponde con un oggetto JSON contenente successo:
    // true e i dati dell'utente (id, email, ruolo). Altrimenti, risponde con successo: false e un messaggio di errore (unauthorized).
    if (results.length > 0) {
      res.json({ successo: true, utente: results[0] });
    } else {
      res
        .status(401)
        .json({ successo: false, messaggio: "Credenziali non valide" });
    }
  });
});

//endpoint GET /api/aule: restituisce tutte le aule presenti nel database
app.get("/api/aule", (req, res) => {
  db.query("SELECT * FROM aule", (err, results) => {
    //gestisce eventuali errori nella lettura dei dati dal database, rispondendo con un messaggio di errore
    if (err) return res.status(500).json({ errore: err.message });
    //restituisce l'elenco delle aule in formato JSON al frontend (client) che ha effettuato la richiesta GET
    res.json(results);
  });
});

//definisce l'endpoint post /api/login per autenticare un utente. Riceve email e password dal corpo della richiesta,
// verifica che siano presenti e poi esegue una query sul database per controllare le credenziali. Se le credenziali sono valide,
// restituisce i dati dell'utente; altrimenti, restituisce un messaggio di errore.
app.post("/api/login", (req, res) => {
  const { email, pw } = req.body;

  //controlla che i campi email e password siano stati forniti nella richiesta. Se uno dei due è mancante,
  // risponde con un messaggio di errore e codice 400 (Bad Request).
  if (!email || !pw) {
    return res.status(400).json({
      messaggio: "Email e password sono obbligatorie",
    });
  }

  //query con ? per prevenire attacchi di tipo SQL injection, selezionando l'id, il nome, l'email e il ruolo dell'utente dal database
  // se le credenziali corrispondono
  const sql =
    "SELECT id, nome, email, ruolo FROM utenti WHERE email = ? AND pw = ? ";

  //esegue la query sul daatabase passando email e pw come param al posto dei segnaposto ?
  db.query(sql, [email, pw], (err, results) => {
    //gestisce eventuali errorri lato db/server rispondendo con un messaggio di errore e codice 500 (Internal Server Error)
    if (err) {
      console.error("Errore nella query di login: ", err);
      return res.status(500).json({
        messaggio: "Errore interno del server durante il login",
      });
    }

    //se non viene trovato alcun record corrispondente significa che le credenziali non sono valide
    if (results.length === 0) {
      return res.status(401).json({
        messaggio: "Credenziali non valide",
      });
    }

    //prende il primo e unico record trovato (dovrebbe esserci al massimo un utente con quelle credenziali)
    // e lo restituisce al frontend con i dati utente
    const utente = results[0];
    return res.status(200).json({
      messaggio: "Login effettuato con successo",
      utente: results[0],
    });
  });
});

//endpoint get /api/prenotazioni: recupera le prenotazioni dal db
app.get("/api/prenotazioni", (req, res) => {
  //legge il param opzionale dalla query string(es. /api/prenotazioni?email=studente@uni.it)
  const { email } = req.query;

  //unisce "prenotazioni" e "aule" tramite join per includere il nome dell'aula
  let sql = `
        SELECT p.id, p.utente_email, p.aula_id, p.data_prenotazione, p.fascia_oraria, a.nome AS aula_nome
        FROM prenotazioni p
        JOIN aule a ON p.aula_id = a.id
    `;

  //array dei val da sostituire ai segnaposto "?" nella query parametrica
  const params = [];

  //se è stata passata una mail, filtra solo le prenotaz di quell'utente
  if (email) {
    sql += "where p.utente_email=?";
    params.push(email);
  }

  //ordina i ris per data e fascia oraria crescenti
  sql += "ORDER BY p.data_prenotazione ASC, p.fascia_oraria ASC";

  //esegue la query su MySql tramite la conn "db"
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Errore lettura prenotazioni: ", err);
      return res
        .status(500)
        .json({ errore: "Errore nel recupero delle prenotazioni" });
    }

    //restituisce l'elenco delle prenotaz in formato json al frontend
    res.json(results);
  });
});

// Endpoint POST /api/prenotazioni: crea una nuova prenotazione verificando che lo slot non sia già occupato
app.post("/api/prenotazioni", (req, res) => {
  // Estrae i dati inviati dal frontend nel corpo JSON della richiesta
  const { utente_email, aula_id, data_prenotazione, fascia_oraria } = req.body;

  // Controlla che tutti i campi obbligatori siano stati compilati
  if (!utente_email || !aula_id || !data_prenotazione || !fascia_oraria) {
    return res
      .status(400)
      .json({ errore: "Compila tutti i campi della prenotazione." });
  }

  // Calcola la data locale odierna in formato YYYY-MM-DD
  const ora = new Date();
  const oggiLocale = `${ora.getFullYear()}-${String(ora.getMonth() + 1).padStart(2, "0")}-${String(ora.getDate()).padStart(2, "0")}`;

  // Confronto lessicografico valido per stringhe nel formato ISO "YYYY-MM-DD"
  if (data_prenotazione < oggiLocale) {
    return res
      .status(400)
      .json({ errore: "Non è possibile prenotare una data passata." });
  }

  // Query di controllo: verifica se esiste già una prenotazione per la stessa aula, data e fascia oraria
  const checkSql = `
        SELECT id FROM prenotazioni
        WHERE aula_id = ? AND data_prenotazione = ? AND fascia_oraria = ?
    `;

  db.query(
    checkSql,
    [aula_id, data_prenotazione, fascia_oraria],
    (err, esistenti) => {
      if (err) {
        console.error("Errore controllo disponibilità:", err);
        return res
          .status(500)
          .json({ errore: "Errore durante la verifica della disponibilità." });
      }

      // Se trova almeno un record esistente, blocca la prenotazione con stato 409 (Conflict)
      if (esistenti.length > 0) {
        return res.status(409).json({
          errore: "L'aula è già prenotata per questa data e fascia oraria.",
        });
      }

      // Query di inserimento parametrica per salvare la nuova prenotazione su MySQL
      const insertSql = `
            INSERT INTO prenotazioni (utente_email, aula_id, data_prenotazione, fascia_oraria)
            VALUES (?, ?, ?, ?)
        `;

      db.query(
        insertSql,
        [utente_email, aula_id, data_prenotazione, fascia_oraria],
        (err, result) => {
          if (err) {
            console.error("Errore inserimento prenotazione:", err);
            return res.status(500).json({
              errore: "Errore durante il salvataggio della prenotazione.",
            });
          }

          // Risponde con stato 201 (Created) e i dati della prenotazione appena creata (incluso il nuovo id)
          res.status(201).json({
            id: result.insertId,
            utente_email,
            aula_id,
            data_prenotazione,
            fascia_oraria,
          });
        },
      );
    },
  );
});

app.delete("/api/prenotazioni/:id", (req, res) => {
  // Recupera l'ID della prenotazione dai parametri dell'URL
  const { id } = req.params;

  // Recupera l'email dell'utente dal corpo JSON o, in alternativa, dalla query string
  const utenteEmail = req.body?.utente_email || req.query?.utente_email;

  // Se manca l'email dell'utente, blocca la richiesta (401)
  if (!utenteEmail) {
    return res.status(401).json({ errore: "Utente non autenticato." });
  }

  // Legge prima la prenotazione dal DB per verificare chi l'ha creata
  db.query(
    "SELECT id, utente_email FROM prenotazioni WHERE id = ?",
    [id],
    (err, rows) => {
      if (err) {
        console.error("Errore lettura prenotazione:", err);
        return res.status(500).json({
          errore: "Errore durante il controllo della prenotazione.",
        });
      }

      // Se la prenotazione non esiste, restituisce 404
      if (rows.length === 0) {
        return res.status(404).json({ errore: "Prenotazione non trovata." });
      }

      const prenotazione = rows[0];

      // Consente l'eliminazione solo se la prenotazione appartiene all'utente che fa la richiesta
      if (prenotazione.utente_email !== utenteEmail) {
        return res.status(403).json({
          errore: "Non puoi annullare la prenotazione di un altro studente.",
        });
      }

      // Elimina la prenotazione dal database
      db.query(
        "DELETE FROM prenotazioni WHERE id = ?",
        [id],
        (delErr, result) => {
          if (delErr) {
            console.error("Errore eliminazione prenotazione:", delErr);
            return res.status(500).json({
              errore: "Errore durante l'annullamento della prenotazione.",
            });
          }

          if (result.affectedRows === 0) {
            return res
              .status(404)
              .json({ errore: "Prenotazione non trovata." });
          }

          res.json({ messaggio: "Prenotazione annullata con successo." });
        },
      );
    },
  );
});

app.listen(port, () => {
  console.log(`Server avviato su http://localhost:${port}`);
});
