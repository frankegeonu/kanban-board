const CHIAVE_GRUPPO_ATTIVO = "kanban_gruppoAttivo";

const nomeAzienda = document.getElementById("nome-azienda");
const nomeUtente = document.getElementById("nome-utente");
const listaGruppi = document.getElementById("lista-gruppi");
const titoloGruppo = document.getElementById("titolo-gruppo");
const messaggioBoard = document.getElementById("messaggio-board");
const pulsanteRipristina = document.getElementById("pulsante-ripristina");
const pulsanteEsci = document.getElementById("pulsante-esci");

proteggiPagina();
const utente = utenteCollegato();

if (utente !== null) {
  avviaSidebar();
}

async function avviaSidebar() {
  nomeAzienda.textContent = utente.azienda;
  nomeUtente.textContent = utente.nome + " " + utente.cognome;

  if (utente.gruppi.length === 0) {
    messaggioBoard.textContent = "Non fai parte di nessun gruppo di lavoro.";
    return;
  }

  try {
    // Carichiamo ogni gruppo per leggerne il nome da mostrare nella sidebar
    for (const idGruppo of utente.gruppi) {
      const gruppo = await caricaGruppo(idGruppo);
      aggiungiGruppoAllaLista(gruppo);
    }
  } catch (errore) {
    messaggioBoard.textContent = "Impossibile caricare i gruppi. Apri il progetto con Live Server.";
    return;
  }

  // Riapriamo l'ultimo gruppo visto, se l'utente ne fa ancora parte
  const gruppoSalvato = sessionStorage.getItem(CHIAVE_GRUPPO_ATTIVO);
  if (utente.gruppi.includes(gruppoSalvato)) {
    apriGruppo(gruppoSalvato);
  } else {
    apriGruppo(utente.gruppi[0]);
  }
}

function aggiungiGruppoAllaLista(gruppo) {
  const elemento = document.createElement("li");
  const pulsante = document.createElement("button");

  pulsante.textContent = gruppo.nome;
  pulsante.dataset.idGruppo = gruppo.id;
  pulsante.addEventListener("click", function () {
    apriGruppo(gruppo.id);
  });

  elemento.appendChild(pulsante);
  listaGruppi.appendChild(elemento);
}

async function apriGruppo(idGruppo) {
  // Evidenziamo nella sidebar il gruppo aperto
  const pulsanti = listaGruppi.querySelectorAll("button");
  pulsanti.forEach(function (pulsante) {
    pulsante.classList.toggle("attivo", pulsante.dataset.idGruppo === idGruppo);
  });

  sessionStorage.setItem(CHIAVE_GRUPPO_ATTIVO, idGruppo);

  try {
    const gruppo = await caricaGruppo(idGruppo);
    const membri = await membriGruppo(idGruppo);

    titoloGruppo.textContent = gruppo.nome;
    messaggioBoard.textContent = "";

    // mostraBoard() è definita in app.js
    mostraBoard(gruppo, membri);
  } catch (errore) {
    messaggioBoard.textContent = "Impossibile caricare il gruppo selezionato.";
  }
}

pulsanteRipristina.addEventListener("click", function () {
  const conferma = confirm("Vuoi cancellare tutte le modifiche e tornare ai dati iniziali?");
  if (conferma) {
    ripristinaDati();
    apriGruppo(sessionStorage.getItem(CHIAVE_GRUPPO_ATTIVO));
  }
});

pulsanteEsci.addEventListener("click", function () {
  sessionStorage.removeItem(CHIAVE_GRUPPO_ATTIVO);
  esci();
});
