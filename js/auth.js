// Gestione dell'accesso degli utenti.
// L'utente collegato viene salvato nel sessionStorage: chiudendo la scheda
// del browser l'accesso scade e bisogna rifare il login.

const CHIAVE_UTENTE_COLLEGATO = "kanban_utenteCollegato";

// Legge l'elenco degli utenti dal file JSON
async function caricaUtenti() {
  const risposta = await fetch("data/utenti.json");
  if (!risposta.ok) {
    throw new Error("Impossibile leggere il file degli utenti");
  }
  return await risposta.json();
}

// Controlla email e password. Restituisce true se l'accesso è riuscito.
async function accedi(email, password) {
  const utenti = await caricaUtenti();

  const utenteTrovato = utenti.find(function (utente) {
    return utente.email === email && utente.password === password;
  });

  if (!utenteTrovato) {
    return false;
  }

  // Non salviamo la password nella sessione: non serve più
  const utenteDaSalvare = {
    id: utenteTrovato.id,
    nome: utenteTrovato.nome,
    cognome: utenteTrovato.cognome,
    email: utenteTrovato.email,
    azienda: utenteTrovato.azienda,
    gruppi: utenteTrovato.gruppi
  };

  sessionStorage.setItem(CHIAVE_UTENTE_COLLEGATO, JSON.stringify(utenteDaSalvare));
  return true;
}

// Restituisce l'utente collegato, oppure null se nessuno ha fatto l'accesso
function utenteCollegato() {
  const testo = sessionStorage.getItem(CHIAVE_UTENTE_COLLEGATO);
  if (testo === null) {
    return null;
  }
  return JSON.parse(testo);
}

// Chiude la sessione e torna alla pagina di login
function esci() {
  sessionStorage.removeItem(CHIAVE_UTENTE_COLLEGATO);
  window.location.href = "login.html";
}

// Da chiamare all'inizio delle pagine riservate:
// se nessuno ha fatto l'accesso si torna al login
function proteggiPagina() {
  if (utenteCollegato() === null) {
    window.location.href = "login.html";
  }
}
