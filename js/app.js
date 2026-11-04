// Board del gruppo di lavoro selezionato: tre colonne con le attività,
// ricerca, creazione e modifica, eliminazione e spostamento con il
// trascinamento.
//
// Quando l'utente apre un gruppo, sidebar.js chiama mostraBoard() con:
// - gruppo: { id, nome, azienda, attivita: [...] }
// - membri: [{ id, nome, cognome }] -> gli utenti assegnabili alle attività
//
// Dopo ogni modifica all'array le attività vengono salvate con
// salvaAttivitaGruppo() di archivio.js.

const MESSAGGI_VUOTI = {
  "Da fare": "Nessuna attività",
  "In corso": "Nulla in corso",
  "Completata": "Niente di completato"
};

const board = document.getElementById("board");
const campoRicerca = document.getElementById("ricerca");
const colonne = document.querySelectorAll(".colonna");
const modelloCard = document.getElementById("modello-card");

const finestra = document.getElementById("finestra-attivita");
const formAttivita = document.getElementById("form-attivita");
const titoloFinestra = document.getElementById("titolo-finestra");
const pulsanteSalva = document.getElementById("pulsante-salva");
const campoTitolo = document.getElementById("campo-titolo");
const campoDescrizione = document.getElementById("campo-descrizione");
const campoPriorita = document.getElementById("campo-priorita");
const campoScadenza = document.getElementById("campo-scadenza");
const campoStato = document.getElementById("campo-stato");
const campoAssegnatario = document.getElementById("campo-assegnatario");

let gruppoAperto = null;   // il gruppo mostrato nella board
let membriGruppoAperto = [];
let idTrascinata = null;   // id dell'attività che si sta trascinando
let idInModifica = null;   // id dell'attività aperta nella finestra, null se è nuova

function mostraBoard(gruppo, membri) {
  gruppoAperto = gruppo;
  membriGruppoAperto = membri;
  campoRicerca.value = "";
  board.hidden = false;
  disegnaBoard();
}

function salva() {
  salvaAttivitaGruppo(gruppoAperto.id, gruppoAperto.attivita);
}

function disegnaBoard() {
  const testoCercato = campoRicerca.value.trim().toLowerCase();

  colonne.forEach(function (colonna) {
    const stato = colonna.dataset.stato;
    const lista = colonna.querySelector(".lista-attivita");
    lista.innerHTML = "";

    const attivitaColonna = gruppoAperto.attivita.filter(function (attivita) {
      return attivita.stato === stato;
    });
    const attivitaVisibili = attivitaColonna.filter(function (attivita) {
      const testo = attivita.titolo + " " + (attivita.descrizione || "");
      return testo.toLowerCase().includes(testoCercato);
    });

    colonna.querySelector(".conteggio").textContent = attivitaColonna.length;

    attivitaVisibili.forEach(function (attivita) {
      lista.appendChild(creaCard(attivita));
    });

    if (attivitaVisibili.length === 0) {
      const vuoto = document.createElement("div");
      vuoto.className = "vuoto";
      vuoto.textContent = attivitaColonna.length > 0 ? "Nessun risultato" : MESSAGGI_VUOTI[stato];
      lista.appendChild(vuoto);
    }
  });
}

function creaCard(attivita) {
  const card = modelloCard.content.firstElementChild.cloneNode(true);
  card.dataset.id = attivita.id;
  card.dataset.priorita = attivita.priorita;
  card.dataset.stato = attivita.stato;

  card.querySelector(".etichetta-priorita").textContent = attivita.priorita;
  card.querySelector(".card-titolo").textContent = attivita.titolo;
  card.querySelector(".assegnatario").textContent = nomeAssegnatario(attivita.assegnatario, membriGruppoAperto);

  const descrizione = card.querySelector(".card-descrizione");
  if (attivita.descrizione) {
    descrizione.textContent = attivita.descrizione;
  } else {
    descrizione.remove();
  }

  const scadenza = card.querySelector(".scadenza");
  if (attivita.scadenza) {
    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);
    const data = new Date(attivita.scadenza + "T00:00:00");
    scadenza.textContent = "📅 " + data.toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
    // Scaduta solo se non è ancora completata
    if (data < oggi && attivita.stato !== "Completata") {
      scadenza.classList.add("scaduta");
    }
  } else {
    scadenza.remove();
  }

  card.querySelector('[data-azione="modifica"]').addEventListener("click", function () {
    apriFinestra(attivita);
  });
  card.querySelector('[data-azione="elimina"]').addEventListener("click", function () {
    gruppoAperto.attivita = gruppoAperto.attivita.filter(function (altra) {
      return altra.id !== attivita.id;
    });
    salva();
    disegnaBoard();
  });
  card.addEventListener("dblclick", function (evento) {
    if (!evento.target.closest("button")) {
      apriFinestra(attivita);
    }
  });

  card.addEventListener("dragstart", function (evento) {
    idTrascinata = attivita.id;
    evento.dataTransfer.effectAllowed = "move";
    evento.dataTransfer.setData("text/plain", String(attivita.id));
    // Aspettiamo un attimo così l'immagine trascinata resta opaca
    setTimeout(function () {
      card.classList.add("trascinata");
    }, 0);
  });
  card.addEventListener("dragend", function () {
    card.classList.remove("trascinata");
    togliEvidenziazioni();
    idTrascinata = null;
  });

  return card;
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

// ---------- Trascinamento ----------

function togliEvidenziazioni() {
  document.querySelectorAll(".sopra, .inserisci-prima").forEach(function (elemento) {
    elemento.classList.remove("sopra", "inserisci-prima");
  });
}

// La prima card della lista che sta sotto il puntatore, oppure null
function cardSuccessiva(lista, y) {
  const card = lista.querySelectorAll(".card:not(.trascinata)");
  for (const elemento of card) {
    const riquadro = elemento.getBoundingClientRect();
    if (y < riquadro.top + riquadro.height / 2) {
      return elemento;
    }
  }
  return null;
}

// Sposta l'attività nella colonna indicata, prima dell'attività idPrima
// (o in fondo se idPrima è null)
function spostaAttivita(id, stato, idPrima) {
  const attivita = gruppoAperto.attivita.find(function (altra) {
    return altra.id === id;
  });
  if (!attivita || id === idPrima) {
    return;
  }

  gruppoAperto.attivita = gruppoAperto.attivita.filter(function (altra) {
    return altra.id !== id;
  });
  attivita.stato = stato;

  const posizione = gruppoAperto.attivita.findIndex(function (altra) {
    return altra.id === idPrima;
  });
  if (posizione === -1) {
    gruppoAperto.attivita.push(attivita);
  } else {
    gruppoAperto.attivita.splice(posizione, 0, attivita);
  }

  salva();
  disegnaBoard();
}

colonne.forEach(function (colonna) {
  const lista = colonna.querySelector(".lista-attivita");

  colonna.addEventListener("dragover", function (evento) {
    if (idTrascinata === null) {
      return;
    }
    evento.preventDefault();
    togliEvidenziazioni();
    colonna.classList.add("sopra");
    const successiva = cardSuccessiva(lista, evento.clientY);
    if (successiva) {
      successiva.classList.add("inserisci-prima");
    }
  });

  colonna.addEventListener("dragleave", function (evento) {
    if (!colonna.contains(evento.relatedTarget)) {
      togliEvidenziazioni();
    }
  });

  colonna.addEventListener("drop", function (evento) {
    evento.preventDefault();
    const successiva = cardSuccessiva(lista, evento.clientY);
    togliEvidenziazioni();
    if (idTrascinata !== null) {
      // Gli id nel dataset sono testo, nelle attività sono numeri
      const idPrima = successiva ? Number(successiva.dataset.id) : null;
      spostaAttivita(idTrascinata, colonna.dataset.stato, idPrima);
    }
  });
});

// ---------- Finestra per creare e modificare ----------

function riempiAssegnatari(idSelezionato) {
  campoAssegnatario.innerHTML = "";

  const nessuno = document.createElement("option");
  nessuno.value = "";
  nessuno.textContent = "Non assegnata";
  campoAssegnatario.appendChild(nessuno);

  membriGruppoAperto.forEach(function (membro) {
    const opzione = document.createElement("option");
    opzione.value = membro.id;
    opzione.textContent = membro.nome + " " + membro.cognome;
    campoAssegnatario.appendChild(opzione);
  });

  campoAssegnatario.value = idSelezionato || "";
}

// Senza attività apre la finestra vuota per crearne una nuova
function apriFinestra(attivita) {
  idInModifica = attivita ? attivita.id : null;
  titoloFinestra.textContent = attivita ? "Modifica attività" : "Nuova attività";
  pulsanteSalva.textContent = attivita ? "Salva" : "Aggiungi";

  campoTitolo.value = attivita ? attivita.titolo : "";
  campoDescrizione.value = attivita ? attivita.descrizione || "" : "";
  campoPriorita.value = attivita ? attivita.priorita : "Media";
  campoScadenza.value = attivita ? attivita.scadenza || "" : "";
  campoStato.value = attivita ? attivita.stato : "Da fare";
  // Una nuova attività è assegnata di default a chi la crea
  riempiAssegnatari(attivita ? attivita.assegnatario : utenteCollegato().id);

  finestra.showModal();
  campoTitolo.focus();
}

// Il prossimo id libero del gruppo
function nuovoId() {
  let massimo = 0;
  gruppoAperto.attivita.forEach(function (attivita) {
    if (attivita.id > massimo) {
      massimo = attivita.id;
    }
  });
  return massimo + 1;
}

document.getElementById("pulsante-nuova").addEventListener("click", function () {
  apriFinestra(null);
});

document.getElementById("pulsante-annulla").addEventListener("click", function () {
  finestra.close();
});

// Clic sullo sfondo scuro fuori dalla finestra
finestra.addEventListener("click", function (evento) {
  if (evento.target === finestra) {
    finestra.close();
  }
});

formAttivita.addEventListener("submit", function (evento) {
  evento.preventDefault();

  const dati = {
    titolo: campoTitolo.value.trim(),
    descrizione: campoDescrizione.value.trim(),
    stato: campoStato.value,
    priorita: campoPriorita.value,
    assegnatario: campoAssegnatario.value,
    scadenza: campoScadenza.value
  };
  if (dati.titolo === "") {
    return;
  }

  if (idInModifica !== null) {
    const attivita = gruppoAperto.attivita.find(function (altra) {
      return altra.id === idInModifica;
    });
    Object.assign(attivita, dati);
  } else {
    dati.id = nuovoId();
    gruppoAperto.attivita.push(dati);
  }

  salva();
  disegnaBoard();
  finestra.close();
});

campoRicerca.addEventListener("input", disegnaBoard);
