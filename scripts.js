//GameState
const GameState = {
    turn         : 0,
    foundPairs   : 0,
    cardType     : "letters",
    boardSize    : 6,
    openColor    : "",
    closedColor  : "",
    foundColor   : "",
    turnedCards  : [],

    get totalPairs() {
        return Math.floor((this.boardSize * this.boardSize) / 2);
    }
};

//timer
let timerDisplay   = document.getElementById('timerDisplay');
let timerInterval  = null;
let timePassed     = 0;


async function startNewGame() {
    prepareGame()
}


//handles form submission
async function submitForm(event) {

    event.preventDefault();
    const formData = new FormData(event.target)
    GameState.cardType = formData.get("cardTypeSelect")
    GameState.boardSize = formData.get("boardSizeSelect")
    GameState.openColor    = formData.get("openCardColor")
    GameState.closedColor  = formData.get("closedCardColor")
    GameState.foundColor   = formData.get("foundCardColor")
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
    document.getElementById("pairCounterSpan").innerHTML=GameState.foundPairs
    document.getElementById("totalPairSpan").innerHTML=GameState.totalPairs
    document.getElementById("turnCounterSpan").innerHTML=GameState.turn


    //set cssvalues(gridsize, cardColors)
    document.documentElement.style.setProperty('--cols', GameState.boardSize);

    document.documentElement.style.setProperty('--open-color', GameState.openColor);
    document.documentElement.style.setProperty('--closed-color', GameState.closedColor);
    document.documentElement.style.setProperty('--found-color', GameState.foundColor);

    //use data to create new board(amount, cardType)
    createBoard(GameState.boardSize, GameState.cardType)
}
//main logic of the memory game
async function makeMove(card) {
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
    }
    if(GameState.totalPairs == GameState.foundPairs){
        pauseTimer()
    }
    unlockBoard() //unlock board

}



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
        newCard.textContent = cardContent
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
        const resp = await fetch("https://cataas.com/cat?json=true");
        const data = await resp.json()
        return data.url
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
        const resp = await fetch("https://cataas.com/cat");
        const data = await resp.json()
        return data.url
    } catch(err) {
        return getCatImage()
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

//to prevent spamming cards while we are checking the flipped ones
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


startNewGame()