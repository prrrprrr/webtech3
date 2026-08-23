/// CARDLIST FACTORY ///
export async function makeCardList(totalPairs, imageType) {
    let cardList = []
    switch (imageType) {
        case "letters":
        cardList = getLetterList(totalPairs);
        break;
        case "dogs":
        cardList = await getImageList(totalPairs, getDogImage)
        break;
        case "cats":
        cardList = await getImageList(totalPairs, getCatImage)
        break;
        case "picsum":
        cardList = await getImageList(totalPairs, getPicsumImage)
        break;
    }
    return shuffle([...cardList, ...cardList])
}

function getLetterList(totalPairs) {

    const Alphabet = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
    ];

    let shuffledDeck = shuffle(Alphabet)

    let selection = shuffledDeck.slice(0,totalPairs)

    return selection
}

async function getImageList(totalPairs, imageFunction) {
    const cards = Array.from({ length: totalPairs}, () => imageFunction())
    return await Promise.all(cards)
}

async function getCatImage(){
    try {
        const resp = await fetch("https://cataas.com/cat");
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
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
        return url 
    } catch(err) {
        return getPicsumImage()
    }
}

//shuffle an array
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