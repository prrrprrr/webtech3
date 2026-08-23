/// HIGHSCORES ///
export async function createHighScoreForm() {
    const highscores = document.getElementById("HighScores")
    highscores.innerHTML= "<h1>Getting highscores</h1>"
    try {
        let scores = await getHighScores()
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
    } catch (error) {
        highscores.innerHTML= "<h1>Error getting highscores</h1>"
    }
    
    
}

async function getHighScores(){
    const resp = await fetch("http://localhost:8000/memory/top-scores")
    const data = await resp.json()
    let top5 = []
    data.forEach(item => top5.push(item))
    return top5.slice(0,5)
}

export async function submitHighScore(score, api, colorFound, colorClosed){
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

    return resp.json()
}