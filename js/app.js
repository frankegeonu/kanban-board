// Board del gruppo di lavoro selezionato.
//
// PROVVISORIO: questa versione mostra solo le tre colonne con i titoli
// delle attività, per provare login e sidebar. Va sostituita con la board
// completa (creazione, spostamento, eliminazione, filtri...).
//
// Quando l'utente apre un gruppo, sidebar.js chiama mostraBoard() con:
// - gruppo: { id, nome, azienda, attivita: [...] }
// - membri: [{ id, nome, cognome }] -> gli utenti assegnabili alle attività
//
// Dopo ogni modifica all'array salvare con:
//   salvaAttivitaGruppo(gruppo.id, gruppo.attivita);

const STATI = ["Da fare", "In corso", "Completata"];

function mostraBoard(gruppo, membri) {
  const board = document.getElementById("board");
  board.innerHTML = "";

  STATI.forEach(function (stato) {
    const attivitaColonna = gruppo.attivita.filter(function (attivita) {
      return attivita.stato === stato;
    });

    const colonna = document.createElement("section");
    const titolo = document.createElement("h3");
    titolo.textContent = stato + " (" + attivitaColonna.length + ")";
    colonna.appendChild(titolo);

    const lista = document.createElement("ul");
    attivitaColonna.forEach(function (attivita) {
      const elemento = document.createElement("li");
      elemento.textContent = attivita.titolo + " - " + nomeAssegnatario(attivita.assegnatario, membri);
      lista.appendChild(elemento);
    });
    colonna.appendChild(lista);

    board.appendChild(colonna);
  });
}

// Dall'id dell'assegnatario ("u1") al nome da mostrare ("Luca Rossi")
function nomeAssegnatario(idUtente, membri) {
  const membro = membri.find(function (utente) {
    return utente.id === idUtente;
  });
  if (!membro) {
    return "Non assegnata";
  }
  return membro.nome + " " + membro.cognome;
}
