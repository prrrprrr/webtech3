import { attemptLogin, attemptRegister } from "./login.js";
import {startNewGame, submitForm} from "./memory.js"

overWriteFetch()
//bootstrap of app
document.addEventListener("DOMContentLoaded", () => {
  setupNavToggle()
  setupFormSubmits()
  setupNewGameForm()
  setupGameWonScreen()
  setupGame()
});


/// setup functions ///
function setupNavToggle () {
  const loginLink = document.getElementById("login-link");
  const logoutLink = document.getElementById("logout-link");

  const isLoggedIn = localStorage.getItem("jwt_token") !== null;

  if (isLoggedIn) {
    if (loginLink) loginLink.style.display = "none";
    if (logoutLink) logoutLink.style.display = "grid";
  } else {
    if (loginLink) loginLink.style.display = "grid";
    if (logoutLink) logoutLink.style.display = "none";
  }

  if (logoutLink) {
    logoutLink.addEventListener("click", (event) => {
      event.preventDefault();
      localStorage.removeItem("jwt_token");
      window.location.replace("index.html");
    });
  }
}
function setupFormSubmits() {
  const loginForm    = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  if(loginForm) {
    loginForm.addEventListener("submit", attemptLogin);
  }
  if (registerForm) {
    registerForm.addEventListener("submit", attemptRegister);
  }

}
function setupGameWonScreen() {
    const gameWonModal = document.getElementById("gameWonModal");
    const playAgainBtn = document.getElementById("closeBtn");
    if (gameWonModal) {
      playAgainBtn.addEventListener("click", () => {
          gameWonModal.classList.add("hidden");
        }
      );
    }

}
function setupNewGameForm() {
    const newGameButton = document.getElementById("newGameForm");
    if (newGameButton) {
        newGameButton.addEventListener("submit", submitForm)
    }
}

//het doel is om de JWT mee te sturen met elke request en om de TTL van de JWT te controleren bij elke request
function overWriteFetch() {
    const originalFetch = window.fetch;
    window.fetch = async function (resource, options = {}) {
    options.headers = options.headers || {};
    //use URL object to parse the url
    try {
        const requestUrl = new URL(
        typeof resource === "string" ? resource : resource.url,
        window.location.origin,
        );

        const isLocalhost =
        requestUrl.hostname === "localhost" ||
        requestUrl.hostname === "127.0.0.1";

        if (isLocalhost) {
        const token = localStorage.getItem("jwt_token");
        //if we have a token we add the header
        if (token) {
            options.headers["Authorization"] = `Bearer ${token}`;
        }
        }
    } catch (error) {
        // Fallback in case URL parsing fails on a malformed string
        console.error("Fetch interceptor URL parsing failed:", error);
    }

    const response = await originalFetch(resource, options);

    //check of het een 401 is
    if (response.status === 401) {
        // We klonen de request om de originele niet aan te tasten
        const clonedResponse = response.clone();

        try {
        const data = await clonedResponse.json();

        // als de foutmelding jwt verlopen bevat
        if (data.message === "jwt verlopen" || data.error === "jwt verlopen") {
            handleExpiredSession();
        }
        } catch (e) {
        const text = await clonedResponse.text();
        if (text.includes("jwt verlopen")) {
            handleExpiredSession();
        }
        }
    }

    return response;
    };
}
function handleExpiredSession() {
  //remove expired token
  localStorage.removeItem("jwt_token");

  //alert player
  alert("Je sessie is verlopen. Log opnieuw in om verder te spelen.");

  //send to loginpage
  window.location.href = "login.html";
}
function setupGame() {
    const memoryBoard = document.getElementById("memoryBoard");
    if (memoryBoard) {
        startNewGame()
    }
}




