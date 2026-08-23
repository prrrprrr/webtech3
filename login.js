

/// LOGIN AND REGISTER ///
export async function attemptLogin(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const GebruikersNaam = formData.get("gebruikersnaam");
  const Wachtwoord = formData.get("wachtwoord");
  const LoginError = document.getElementById("loginError")
  errorCleanup()

    if (!GebruikersNaam || !Wachtwoord ) {
    LoginError.innerHTML = "Vul alles in!"
    LoginError.classList.remove("hidden")
    return
  }
  try {
    const response = await fetch("http://localhost:8000/memory/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: GebruikersNaam, password: Wachtwoord }),
    });

    const data = await response.json();

    if (response.ok) {
      // Save the token under the key "jwt_token"
      localStorage.setItem("jwt_token", data.token);
      console.log("Token opgeslagen!");
      window.location.href = "index.html";
    } else {
      console.error("Login failed:", data.message);
      LoginError.innerHTML = "Inloggen mislukt!"
      LoginError.classList.remove("hidden")
    }
  } catch (error) {
    console.error("Network error:", error);
    LoginError.innerHTML = "Inloggen mislukt!"
    LoginError.classList.remove("hidden")
  }
}
export async function attemptRegister(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const GebruikersNaam = formData.get("gebruikersnaam");
  const Wachtwoord = formData.get("wachtwoord");
  const Email = formData.get("email");
  const RegisterError = document.getElementById("registerError")
  errorCleanup()

  if (!GebruikersNaam || !Wachtwoord || !Email ) {
    RegisterError.innerHTML = "Vul alles in!"
    RegisterError.classList.remove("hidden")
    return
  }
  try {
    const response = await fetch("http://localhost:8000/memory/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: GebruikersNaam,
        password: Wachtwoord,
        email: Email,
      }),
    });
    try {
      const data = await response.json();
    } catch (error) {
      console.log("this empty json is the issue");
    }

    if (response.ok) {
      RegisterError.innerHTML = "Registreren gelukt!"
      RegisterError.classList.remove("hidden")
    } else {
      console.error("register failed:", data.message);
      RegisterError.innerHTML = "Registreren mislukt!"
      RegisterError.classList.remove("hidden")
    }
  } catch (error) {
    console.error("Network error:", error);
    RegisterError.innerHTML = "Registreren mislukt!"
    RegisterError.classList.remove("hidden")
  }
}
function errorCleanup() {
  const RegisterError = document.getElementById("registerError")
  const LoginError = document.getElementById("loginError")
  LoginError.innerHTML = ''
  RegisterError.innerHTML = ''
}