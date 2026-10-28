// Caricamento e salvataggio delle attività dei gruppi di lavoro.
//
// I file in data/gruppi/ contengono i dati iniziali e il browser li può
// solo leggere. Tutte le modifiche vengono salvate nel localStorage, con
// una chiave per ogni gruppo (es. "kanban_gruppo_marketing").
// Quando si apre un gruppo si usano i dati del localStorage se ci sono,
// altrimenti quelli del file JSON.
//
// Usa caricaUtenti() di auth.js, quindi auth.js va incluso prima.

const PREFISSO_GRUPPO = "kanban_gruppo_";

// Restituisce il gruppo { id, nome, azienda, attivita } con le attività aggiornate
async function caricaGruppo(idGruppo) {
  const risposta = await fetch("data/gruppi/" + idGruppo + ".json");
  if (!risposta.ok) {
    throw new Error("Impossibile leggere il gruppo " + idGruppo);
  }
  const gruppo = await risposta.json();

  const attivitaSalvate = localStorage.getItem(PREFISSO_GRUPPO + idGruppo);
  if (attivitaSalvate !== null) {
    gruppo.attivita = JSON.parse(attivitaSalvate);
  }

  return gruppo;
}

// Salva l'array delle attività di un gruppo. Va chiamata dopo ogni modifica.
function salvaAttivitaGruppo(idGruppo, attivita) {
  localStorage.setItem(PREFISSO_GRUPPO + idGruppo, JSON.stringify(attivita));
}

// Restituisce gli utenti che fanno parte del gruppo (senza password).
// Serve per scegliere l'assegnatario di un'attività.
async function membriGruppo(idGruppo) {
  const utenti = await caricaUtenti();

  const membri = utenti.filter(function (utente) {
    return utente.gruppi.includes(idGruppo);
  });

  return membri.map(function (utente) {
    return { id: utente.id, nome: utente.nome, cognome: utente.cognome };
  });
}

// Cancella tutte le modifiche salvate: i gruppi tornano ai dati dei file JSON
function ripristinaDati() {
  // Prima raccogliamo le chiavi, poi le cancelliamo, perché cancellando
  // durante il ciclo gli indici del localStorage cambierebbero
  const chiaviDaCancellare = [];
  for (let i = 0; i < localStorage.length; i++) {
    const chiave = localStorage.key(i);
    if (chiave.startsWith(PREFISSO_GRUPPO)) {
      chiaviDaCancellare.push(chiave);
    }
  }

  chiaviDaCancellare.forEach(function (chiave) {
    localStorage.removeItem(chiave);
  });
}
