# Kanban Board

Web App per organizzare le attività dei gruppi di lavoro in tre colonne:
**Da fare**, **In corso** e **Completata**.

Gruppo: Egeonu - Derbach - Bussi

## Come avviare il progetto

Il progetto legge i dati da file JSON, quindi **va aperto con Live Server**
(estensione di VS Code): tasto destro su `login.html` → *Open with Live Server*.
Aprendo i file con doppio clic il browser blocca la lettura dei JSON.

## Utenti di prova

| Email | Password | Azienda | Gruppi |
|---|---|---|---|
| luca.rossi@techsolutions.it | luca123 | Tech Solutions Srl | Sviluppo, Marketing |
| giulia.bianchi@techsolutions.it | giulia123 | Tech Solutions Srl | Sviluppo |
| marco.verdi@techsolutions.it | marco123 | Tech Solutions Srl | Marketing |
| sara.neri@studiografico.it | sara123 | Studio Grafico Srl | Grafica |
| paolo.gallo@studiografico.it | paolo123 | Studio Grafico Srl | Grafica |

## Struttura

```
login.html            pagina di accesso
index.html            sidebar dei gruppi + board
css/login.css         stile del login
css/sidebar.css       stile della sidebar e della pagina
css/board.css         stile della board, delle card e della finestra
js/auth.js            accesso, uscita, utente collegato
js/login.js           collega il form di login ad auth.js
js/archivio.js        caricamento e salvataggio delle attività
js/sidebar.js         sidebar: azienda, utente, gruppi
js/app.js             board del gruppo: ricerca, creazione, modifica, trascinamento
data/utenti.json      utenti (creati da noi, niente registrazione)
data/gruppi/*.json    un file per gruppo con le attività iniziali
```

## Come vengono salvati i dati

- Gli **utenti** sono in `data/utenti.json`. Ogni utente ha la sua azienda e
  l'elenco dei gruppi di cui fa parte.
- Le **attività** appartengono a un gruppo, non a un utente. Ogni file in
  `data/gruppi/` contiene i dati iniziali di un gruppo.
- Il browser non può modificare i file JSON, quindi **ogni modifica viene
  salvata nel localStorage** con la chiave `kanban_gruppo_<id>`. All'apertura
  di un gruppo si usano i dati del localStorage se presenti, altrimenti quelli
  del file JSON.
- Il pulsante **Ripristina dati** cancella le modifiche e riporta tutti i
  gruppi ai dati dei file JSON.
- L'utente collegato è salvato nel **sessionStorage**: chiudendo la scheda
  l'accesso scade.

## Funzioni disponibili per la board

| Funzione | File | Cosa fa |
|---|---|---|
| `caricaGruppo(idGruppo)` | archivio.js | restituisce `{ id, nome, azienda, attivita }` (async) |
| `salvaAttivitaGruppo(idGruppo, attivita)` | archivio.js | salva l'array delle attività, da chiamare dopo ogni modifica |
| `membriGruppo(idGruppo)` | archivio.js | utenti del gruppo `[{ id, nome, cognome }]`, per l'assegnatario (async) |
| `utenteCollegato()` | auth.js | l'utente che ha fatto l'accesso |

Quando si apre un gruppo, `sidebar.js` chiama `mostraBoard(gruppo, membri)`,
che va definita in `app.js`.

### Struttura di un'attività

```js
{
  id: 1,
  titolo: "Pagina di login",
  descrizione: "Creare il form di accesso",
  stato: "Da fare",         // "Da fare" | "In corso" | "Completata"
  priorita: "Alta",         // "Bassa" | "Media" | "Alta"
  assegnatario: "u1",       // id di un membro del gruppo
  scadenza: "2026-11-05"
}
```
