//GameState
const GameState = {
    turn           : 0,
    foundPairs     : 0,
    cardType       : "letters",
    boardSize      : 6,
    openColor      : "",
    closedColor    : "",
    foundColor     : "",
    turnedCards    : [],
    shuffle        : 0,

    get totalPairs() {
        return Math.floor((this.boardSize * this.boardSize) / 2);
    }
};
let urlRegistry = []

//timer
let timerDisplay   = document.getElementById('timerDisplay');
let timerInterval  = null;
let timePassed     = 0;


/// OVERWRITE OF FETCH FUNCTION ///
const originalFetch = window.fetch;

//het doel is om de JWT mee te sturen met elke request en om de TTL van de JWT te controleren bij elke request
window.fetch = async function (resource, options = {}) {
  options.headers = options.headers || {};
  //use URL object to parse the url 
  try {
    const requestUrl = new URL(
      typeof resource === 'string' ? resource : resource.url, 
      window.location.origin
    );

    const isLocalhost = requestUrl.hostname === 'localhost' || requestUrl.hostname === '127.0.0.1';

    if (isLocalhost) {
      const token = localStorage.getItem('jwt_token');
      //if we have a token we add the header
      if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
        
      }
    }
  } catch (error) {
    // Fallback in case URL parsing fails on a malformed string
    console.error('Fetch interceptor URL parsing failed:', error);
  }

  return originalFetch(resource, options);

  /// HIER BEGINT HET GEKKE DEEL

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

/// STARTING AND PREPARING A GAME ///
async function startNewGame() {
    prepareGame()
}

function handleExpiredSession() {
    //remove expired token
    localStorage.removeItem('jwt_token');

    //alert player
    alert("Je sessie is verlopen. Log opnieuw in om verder te spelen.");

    //send to loginpage
    window.location.href = "login.html"
}
//handles form submission
async function submitForm(event) {

    event.preventDefault();

    const formData             = new FormData(event.target)
    GameState.cardType         = formData.get("cardTypeSelect") ?? "letters"
    GameState.boardSize        = formData.get("boardSizeSelect") ?? 6
    GameState.openColor        = formData.get("openCardColor")
    GameState.closedColor      = formData.get("closedCardColor")
    GameState.foundColor       = formData.get("foundCardColor")
    GameState.shuffle          = setShuffleDifficulty(formData.get("shuffleRadio")) ?? 0;
    
    console.log(GameState)

    prepareGame()
}
//prepares the game with the new settings
async function prepareGame() {
    GameState.timePassed  = 0
    GameState.foundPairs  = 0
    GameState.turn        = 0
    GameState.turnedCards = []
    
    //edit dom elements
    resetTimer()
    urlRegistry.forEach( (url) => URL.revokeObjectURL(url))
    urlRegistry = []
    document.getElementById("pairCounterSpan").innerHTML=GameState.foundPairs
    document.getElementById("totalPairSpan").innerHTML=GameState.totalPairs
    document.getElementById("turnCounterSpan").innerHTML=GameState.turn


    //set cssvalues(gridsize, cardColors)
    document.documentElement.style.setProperty('--cols', GameState.boardSize);
    document.documentElement.style.setProperty('--open-color', GameState.openColor);
    document.documentElement.style.setProperty('--closed-color', GameState.closedColor);
    document.documentElement.style.setProperty('--found-color', GameState.foundColor);


    //pull highscores from backend
    try {
        top5 = await getHighScores()
        createHighScoreForm(top5)
    }catch(e){
        document.getElementById("HighScores").innerHTML= "<h1>No highscores could be pulled</h1>"
    }
    //use data to create new board(amount, cardType)
    createBoard(GameState.boardSize, GameState.cardType)
}

/// GameEnd ///
async function endGame(turn, cardType, colorFound, colorClosed, timePassed) {
    console.log("did we end")
    console.log(turn, cardType, colorFound, colorClosed, timePassed)

    //calculate score
    score = calculateScore(turn, timePassed)
    //show endScreen
    span = document.getElementById("scoreSpan").innerText = score
    gameWonModal.classList.remove("hidden");




    //produce winning screen TODO


    //sumbit score
    submitHighScore(score, cardType, colorFound, colorClosed)

}

function calculateScore(turn,timePassed) {
    return score = (turn * 10) + (timePassed*2)
}


/// MAIN MOVE FUNCTION ///
async function makeMove(card) {
    //start timer on first turn
    if(GameState.turn == 0 && GameState.turnedCards == 0){
        startTimer()
    }
    //remove pointer events from cards to prevent spamming
    lockBoard() 

    //process flip
    GameState.turnedCards.push(card);
    flipCardToOpen(card)

    //if its the 2nd card we check for a pair
    if (GameState.turnedCards.length > 1 ) { 

        //check for pair
        if (pairFound(GameState.turnedCards[0], GameState.turnedCards[1])) {
            GameState.foundPairs++
            document.getElementById("pairCounterSpan").innerHTML=GameState.foundPairs
            GameState.turnedCards.forEach(flipCardToFound)
            GameState.turnedCards = []
        }else{
            await sleep(750)
            GameState.turnedCards.forEach(flipCardToClosed)
            GameState.turnedCards = []
        }   
        GameState.turn++
        document.getElementById("turnCounterSpan").innerHTML = GameState.turn

        if (GameState.shuffle != 0 && GameState.turn % GameState.shuffle== 0 ) {
            shuffleCards()
        }

    }
    if(GameState.totalPairs == GameState.foundPairs){
        pauseTimer()
        endGame(GameState.turn, GameState.cardType, GameState.foundColor, GameState.closedColor, timePassed)
    }
    unlockBoard() //unlock board

}


/// FACTORY FOR CARDS ///
function createCard(cardContent) {
    const newCard = document.createElement("div");
    newCard.classList.add("card")
    newCard.classList.add("card-closed")
    newCard.addEventListener('click', (e) => makeMove(e.currentTarget))
    if(cardContent.length != 1){
        const img = document.createElement("img")
        img.src = cardContent
        newCard.appendChild(img)
    }else{
        const span = document.createElement("span")
        span.classList.add("memory-letter")
        span.innerHTML = cardContent
        newCard.appendChild(span)
    }
    return newCard
}

/// FACTORY FOR BOARD ///
async function createBoard(boardSize, cardType){
    //calculate amount of pairs
    totalPairs = Math.floor((boardSize*boardSize)/2)
    
    //grab board DOM element
    let board = document.getElementById("memoryBoard")

    //get a shuffled list of cards
    let cards = await makeCardList(GameState.totalPairs, cardType)

    //clean up board
    board.innerHTML = "";
 
    //turn list of cards into DOM elements of the board
    cards.forEach((card) => {
        board.appendChild(createCard(card))
    })
}

/// CARDLIST HANDLERS ///
async function makeCardList(totalPairs, imageType) {
    let cardList = []
    switch (imageType) {
        case "letters":
        cardList = getLetterList();
        break;
        case "dogs":
        cardList = await getImageList(getDogImage)
        break;
        case "cats":
        cardList = await getImageList(getCatImage)
        break;
        case "picsum":
        cardList = await getImageList(getPicsumImage)
        break;
    }
    console.log(cardList)
    return shuffle([...cardList, ...cardList])
    
}

function getLetterList() {
    //create alphabet
    const Alphabet = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
    ];

    //shuffle list so we dont get the same letters everytime
    shuffledDeck = shuffle(Alphabet)

    //grab selection
    selection = shuffledDeck.slice(0,GameState.totalPairs)

    //return selection
    return selection
}


async function getImageList(imageFunction) {
    console.log(imageFunction)
    const cards = Array.from({ length: GameState.totalPairs}, () => imageFunction())
    return await Promise.all(cards)
}


/// API FUNCTIONS ///
async function getCatImage(){
    try {
        const resp = await fetch("https://cataas.com/cat");
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        urlRegistry.push(url)
        return url
    } catch(err) {
        return getCatImage()
    }
   
}
async function getDogImage(){
    try {
        const resp = await fetch("https://dog.ceo/api/breeds/image/random");
        const data = await resp.json()
        return data.message
    } catch(err) {
        return getDogImage()
    }
   
}
async function getPicsumImage(){
    try {
        const resp = await fetch("https://picsum.photos/200");
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        urlRegistry.push(url)
        return url 
    } catch(err) {
        return getPicsumImage()
    }
}

/// cardflips ///
function flipCardToOpen(card) {
    card.classList.remove("card-closed")
    card.classList.add("card-open")
}
function flipCardToClosed(card) {
    card.classList.remove("card-open")
    card.classList.add("card-closed")
}
function flipCardToFound(card) {
    card.classList.remove("card-open")
    card.classList.add("card-found")
}

function shuffleCards() {
    const board = document.getElementById('memoryBoard');
    const cards = Array.from(board.children); // get all card divs as an array
    const shuffledCards = shuffle(cards)
    cards.forEach(card => board.appendChild(card));
}

/// TIMER ///
function startTimer() {
    if (timerInterval !== null) return; 
    timerInterval = setInterval(() => {
        timePassed++;
        timerDisplay.textContent = timePassed;
    }, 1000); //run every second
}

function pauseTimer() {
    clearInterval(timerInterval);
    timerInterval = null; // Reset interval status so it can be restarted
}

//stop timer and reset to 0
function resetTimer() {
    pauseTimer();
    timePassed = 0;
    timerDisplay.textContent = timePassed; 
}


/// UTIL ///
//make the program wait for n milliseconds
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

//shuffle the array
function shuffle(array) {
  // Loop from the last element down to the second element
  for (let i = array.length - 1; i > 0; i--) {
    // Pick a random index from 0 to i
    const j = Math.floor(Math.random() * (i + 1));
    
    // Swap elements array[i] and array[j]
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

//to prevent spamming cards while checking the flipped ones
function lockBoard() {
  document.querySelectorAll('.card-closed').forEach(card => {
    card.style.pointerEvents = 'none';
  });
}

function unlockBoard() {
  document.querySelectorAll('.card-closed').forEach(card => {
    card.style.pointerEvents = 'auto';
  });
}

//check if two DOM elements contain the same HTML
function pairFound(card1,card2) {
    if(card1.innerHTML == card2.innerHTML) {
        return true
    }
    return false
}
function setShuffleDifficulty(input) {
    return Math.floor((+input) * GameState.boardSize);
}


/// HIGHSCORES ///
function createHighScoreForm(scores) {
    console.log("we got some scores")
    console.log(scores)
    const highscores = document.getElementById("HighScores")
    highscores.innerHTML = ''
    let i = 1
    scores.forEach( score => 
        {
            const highscore = document.createElement("p")
            highscore.textContent = i+" "+score.username+": "+score.score
            highscores.appendChild(highscore)
            i++
        }
    )
}

async function getHighScores(){
    const resp = await fetch("http://localhost:8000/memory/top-scores")
    const data = await resp.json()
    let top5 = []
    data.forEach(item => top5.push(item))
    console.log(top5)
    return top5.slice(0,5)
}

async function submitHighScore(score, api, colorFound, colorClosed){
    console.log(score, api, colorFound, colorClosed)
    const token = localStorage.getItem("jwt_token")
    if (!token) {
        console.log("No token found. Redirecting to login...");
        return;
    }

    const resp = await fetch("http://localhost:8000/game/save", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
            score: score,
            api: api ,
            color_found: colorFound,
            color_closed: colorClosed
         })
    })

    if (!resp.ok) {
        throw new Error(`Request failed: ${resp.status}`)
    }

    return resp.json() // or resp.text(), depending on what your server sends back
}


/// LOGIN AND REGISTER ///
async function attemptLogin (event) {
    event.preventDefault()
    const formData         = new FormData(event.target)
    const GebruikersNaam   = formData.get("gebruikersnaam")
    const Wachtwoord       = formData.get("wachtwoord")
    try {
        const response = await fetch("http://localhost:8000/memory/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username : GebruikersNaam, password: Wachtwoord })
        });

        const data = await response.json();

        if (response.ok) {
            // Save the token under the key "jwt_token"
            localStorage.setItem("jwt_token", data.token);
            console.log("Token saved successfully!");
            window.location.href = "memory.html"
        } else {
            console.error("Login failed:", data.message);
            alert("kon niet inloggen")
        }
    } catch (error) {
        console.error("Network error:", error);
    }
    
}


async function attemptRegister(event) {
    event.preventDefault()
    const formData        = new FormData(event.target)
    const GebruikersNaam  = formData.get("gebruikersnaam")
    const Wachtwoord      = formData.get("wachtwoord")
    const Email           = formData.get("email")
    try {
        const response = await fetch("http://localhost:8000/memory/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username : GebruikersNaam, password: Wachtwoord, email: Email })
        });

        const data = await response.json();

        if (response.ok) {
            console.log("Token saved successfully!");
        } else {
            console.error("register failed:", data.message);
            alert("kon niet registreren")
        }
    } catch (error) {
        console.error("Network error:", error);
    }
}
//make the login/logout button appear and dissapear when needed
document.addEventListener("DOMContentLoaded", () => {
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
            window.location.replace("memory.html");
        });
    }
});


const gameWonModal = document.getElementById("gameWonModal");
const playAgainBtn = document.getElementById("closeBtn");
closeBtn.addEventListener("click", () => {
    gameWonModal.classList.add("hidden");
});

startNewGame()