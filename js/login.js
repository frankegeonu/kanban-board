// Collega il form della pagina di login alle funzioni di auth.js

const formLogin = document.getElementById("form-login");
const campoEmail = document.getElementById("email");
const campoPassword = document.getElementById("password");
const messaggioErrore = document.getElementById("messaggio-errore");

// Se l'utente ha già fatto l'accesso lo mandiamo direttamente alla board
if (utenteCollegato() !== null) {
  window.location.href = "index.html";
}

formLogin.addEventListener("submit", async function (evento) {
  // Evita che il form ricarichi la pagina
  evento.preventDefault();

  const email = campoEmail.value.trim().toLowerCase();
  const password = campoPassword.value;

  if (email === "" || password === "") {
    messaggioErrore.textContent = "Inserisci email e password.";
    return;
  }

  try {
    const accessoRiuscito = await accedi(email, password);

    if (accessoRiuscito) {
      window.location.href = "index.html";
    } else {
      messaggioErrore.textContent = "Email o password errate.";
      campoPassword.value = "";
    }
  } catch (errore) {
    // Succede di solito se la pagina è aperta con doppio clic invece che con Live Server
    messaggioErrore.textContent = "Impossibile caricare gli utenti. Apri il progetto con Live Server.";
  }
});
