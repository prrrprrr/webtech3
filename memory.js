import { createHighScoreForm, submitHighScore } from "./highscores.js";
import { makeCardList } from "./cards.js";

//GameState
const GameState = {
  turn: 0,
  foundPairs: 0,
  cardType: "letters",
  boardSize: 6,
  openColor: "",
  closedColor: "",
  foundColor: "",
  turnedCards: [],
  shuffle: 0,

  get totalPairs() {
    return Math.floor((this.boardSize * this.boardSize) / 2);
  },
};

//timer
let timerDisplay = document.getElementById("timerDisplay");
let timerInterval = null;
let timePassed = 0;


/// STARTING AND PREPARING A GAME ///
export async function startNewGame() {
  console.log('starting a new game')
  prepareGame();
}

//handles form submission
export async function submitForm(event) {
  event.preventDefault();
  lockBoard()

  const formData = new FormData(event.target);
  GameState.cardType = formData.get("cardTypeSelect") ?? "letters";
  GameState.boardSize = formData.get("boardSizeSelect") ?? 6;
  GameState.openColor = formData.get("openCardColor");
  GameState.closedColor = formData.get("closedCardColor");
  GameState.foundColor = formData.get("foundCardColor");
  GameState.shuffle = setShuffleDifficulty(formData.get("shuffleRadio")) ?? 0;

  await prepareGame();
  unlockBoard()
}

//prepares the game with the new settings
async function prepareGame() {
  GameState.timePassed = 0;
  GameState.foundPairs = 0;
  GameState.turn = 0;
  GameState.turnedCards = [];

  //edit dom elements
  resetTimer();
  document.getElementById("pairCounterSpan").innerHTML = GameState.foundPairs;
  document.getElementById("totalPairSpan").innerHTML = GameState.totalPairs;
  document.getElementById("turnCounterSpan").innerHTML = GameState.turn;
  document.getElementById("memoryBoard").innerHTML = ''

  createHighScoreForm();
  
  await renderBoard(GameState.totalPairs, GameState.cardType, document.getElementById("memoryBoard"));

  document.documentElement.style.setProperty(
    "--cols",
    GameState.boardSize);
  document.documentElement.style.setProperty(
    "--open-color",
    GameState.openColor,
  );
  document.documentElement.style.setProperty(
    "--closed-color",
    GameState.closedColor,
  );
  document.documentElement.style.setProperty(
    "--found-color",
    GameState.foundColor,
  );
}

/// GameEnd ///
async function endGame(turn, cardType, colorFound, colorClosed, timePassed) {
  //calculate score
  let score = calculateScore(turn, timePassed);
  //show endScreen
  let span = document.getElementById("scoreSpan").innerText = score;
  let gameWonModal = document.getElementById("gameWonModal")
  gameWonModal.classList.remove("hidden");

  await submitHighScore(score, cardType, colorFound, colorClosed);
  createHighScoreForm();
}

function calculateScore(turn, timePassed) {
  return turn * 10 + timePassed * 2;
}

/// MAIN MOVE FUNCTION ///
async function makeMove(card) {
  //start timer on first turn
  if (GameState.turn == 0 && GameState.turnedCards == 0) {
    startTimer();
  }
  //remove pointer events from cards to prevent spamming
  lockBoard();

  //process flip
  GameState.turnedCards.push(card);
  flipCardToOpen(card);

  //if its the 2nd card we check for a pair
  if (GameState.turnedCards.length > 1) {
    //check for pair
    if (pairFound(GameState.turnedCards[0], GameState.turnedCards[1])) {
      GameState.foundPairs++;
      document.getElementById("pairCounterSpan").innerHTML =
        GameState.foundPairs;
      GameState.turnedCards.forEach(flipCardToFound);
      GameState.turnedCards = [];
    } else {
      await sleep(750);
      GameState.turnedCards.forEach(flipCardToClosed);
      GameState.turnedCards = [];
    }
    GameState.turn++;
    document.getElementById("turnCounterSpan").innerHTML = GameState.turn;

    if (GameState.shuffle != 0 && GameState.turn % GameState.shuffle == 0) {
      shuffleCards();
    }
  }
  if (GameState.totalPairs == GameState.foundPairs) {
    pauseTimer();
    endGame(
      GameState.turn,
      GameState.cardType,
      GameState.foundColor,
      GameState.closedColor,
      timePassed,
    );
  }
  unlockBoard(); //unlock board
}

/// FACTORY FOR CARDS ///
function createCard(cardContent) {
  const newCard = document.createElement("div");
  newCard.classList.add("card");
  newCard.classList.add("card-closed");
  newCard.addEventListener("click", (e) => makeMove(e.currentTarget));
  if (cardContent.length != 1) {
    const img = document.createElement("img");
    img.src = cardContent;
    newCard.appendChild(img);
  } else {
    const span = document.createElement("span");
    span.classList.add("memory-letter");
    span.innerHTML = cardContent;
    newCard.appendChild(span);
  }
  return newCard;
}

async function renderBoard(amount, cardType, domElement) {

  let board = domElement;

  //get a shuffled list of cards
  let cards = await makeCardList(amount, cardType);

  //clean up board
  board.innerHTML = "";

  //render board
  cards.forEach((card) => {
    board.appendChild(createCard(card));
  });
}

/// cardflips ///
function flipCardToOpen(card) {
  card.classList.remove("card-closed");
  card.classList.add("card-open");
}

function flipCardToClosed(card) {
  card.classList.remove("card-open");
  card.classList.add("card-closed");
}

function flipCardToFound(card) {
  card.classList.remove("card-open");
  card.classList.add("card-found");
}

function shuffleCards() {
  const board = document.getElementById("memoryBoard");
  const cards = Array.from(board.children); // get all card divs as an array
  const shuffledcards = shuffle(cards);
  cards.forEach((card) => board.appendChild(card));
}

/// UTIL ///
//make the program wait for n milliseconds
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

//shuffle the array
function shuffle(array) {
  let newArray = array;
  // Loop from the last element down to the second element
  for (let i = newArray.length - 1; i > 0; i--) {
    // Pick a random index from 0 to i
    const j = Math.floor(Math.random() * (i + 1));

    // Swap elements array[i] and array[j]
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

//to prevent spamming cards while checking the flipped ones
function lockBoard() {
  document.querySelectorAll(".card-closed").forEach((card) => {
    card.style.pointerEvents = "none";
  });
}

function unlockBoard() {
  document.querySelectorAll(".card-closed").forEach((card) => {
    card.style.pointerEvents = "auto";
  });
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

//check if two DOM elements contain the same HTML
function pairFound(card1, card2) {
  if (card1.innerHTML == card2.innerHTML) {
    return true;
  }
  return false;
}

function setShuffleDifficulty(input) {
  return Math.floor(+input * GameState.boardSize);
}