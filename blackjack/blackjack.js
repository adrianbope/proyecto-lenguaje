let session = JSON.parse(localStorage.getItem('session'));
let balance = session ? session.balance : 0;
let deck = [], playerHand = [], dealerHand = [], currentBet = 0;

const sfx = {
    chip: new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'),
    card: new Audio('https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3'),
    win: new Audio('https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3'),
    lose: new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3')
};

function playSfx(name) {
    let vol = document.getElementById('volumeSlider').value;
    sfx[name].volume = vol;
    sfx[name].currentTime = 0;
    sfx[name].play().catch(() => {});
}

function vibrate(pattern) {
    if (navigator.vibrate) {
        navigator.vibrate(pattern);
    }
}

function updateUI() {
    document.getElementById('balance-val').innerText = balance.toFixed(2);
    document.getElementById('bet-amount').innerText = currentBet;
}

function addChip(amount) {
    if (balance >= amount) {
        currentBet += amount;
        balance -= amount;
        playSfx('chip');
        vibrate(40); // Vibración corta al tocar ficha
        updateUI();
    }
}

function clearBet() {
    balance += currentBet;
    currentBet = 0;
    vibrate(20);
    updateUI();
}

function saveToStorage() {
    session.balance = balance;
    let users = JSON.parse(localStorage.getItem('users')) || [];
    let i = users.findIndex(u => u.user === session.user);
    if (i !== -1) { 
        users[i].balance = balance; 
        localStorage.setItem('users', JSON.stringify(users)); 
    }
    localStorage.setItem('session', JSON.stringify(session));
}

function createDeck() {
    const values = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
    const suits = ['♠','♣','♥','♦'];
    deck = [];
    suits.forEach(s => values.forEach(v => deck.push({v, s})));
    deck.sort(() => Math.random() - 0.5);
}

function getScore(hand) {
    let score = 0, aces = 0;
    hand.forEach(card => {
        if (card.v === 'A') aces++;
        else if (['J','Q','K'].includes(card.v)) score += 10;
        else score += parseInt(card.v);
    });
    for (let i = 0; i < aces; i++) {
        if (score + 11 <= 21) score += 11;
        else score += 1;
    }
    return score;
}

function render() {
    const color = (s) => (s === '♥' || s === '♦') ? 'red' : 'black';
    document.getElementById('player-hand').innerHTML = playerHand.map(c => `<div class="card-img" style="color:${color(c.s)}">${c.v}${c.s}</div>`).join('');
    document.getElementById('dealer-hand').innerHTML = dealerHand.map(c => `<div class="card-img" style="color:${color(c.s)}">${c.v}${c.s}</div>`).join('');
    
    const pScore = getScore(playerHand);
    const dScore = getScore(dealerHand);
    const pBadge = document.getElementById('player-score');
    const dBadge = document.getElementById('dealer-score');
    
    pBadge.innerText = pScore;
    dBadge.innerText = dScore;
    pBadge.style.visibility = "visible";
    dBadge.style.visibility = "visible";
    pBadge.style.color = (pScore > 21) ? "#ff4444" : "white";

    const btnDouble = document.getElementById('btn-double');
    if (btnDouble) {
        btnDouble.style.display = (playerHand.length === 2) ? "inline-block" : "none";
    }
}

function startGame() {
    if (currentBet <= 0) return;
    document.getElementById('betting-ui').style.display = "none";
    document.getElementById('game-ui').style.display = "grid";
    document.getElementById('message').innerText = "";
    
    createDeck();
    playerHand = [deck.pop(), deck.pop()];
    dealerHand = [deck.pop()];
    playSfx('card');
    vibrate([50, 30, 50]); // Vibración de reparto
    render();

    if (getScore(playerHand) === 21) {
        let ganancias = currentBet * 1.5;
        balance += (currentBet + ganancias);
        endGame(`¡BLACKJACK! +$${ganancias.toFixed(2)}`, "win");
    }
}

function hit() {
    playerHand.push(deck.pop());
    playSfx('card');
    vibrate(60);
    render();
    if (getScore(playerHand) > 21) {
        endGame(`TE PASASTE -$${currentBet.toFixed(2)}`, "lose");
    }
}

function doubleDown() {
    if (balance >= currentBet) {
        balance -= currentBet;
        currentBet *= 2;
        updateUI();
        vibrate([100, 50, 100]);
        playerHand.push(deck.pop());
        playSfx('card');
        render();
        if (getScore(playerHand) > 21) {
            endGame(`TE PASASTE -$${currentBet.toFixed(2)}`, "lose");
        } else {
            setTimeout(stand, 600); 
        }
    }
}

function stand() {
    while (getScore(dealerHand) < 17) {
        dealerHand.push(deck.pop());
    }
    playSfx('card');
    render();
    
    let pS = getScore(playerHand), dS = getScore(dealerHand);
    if (dS > 21 || pS > dS) { 
        balance += currentBet * 2; 
        endGame(`¡GANASTE! +$${currentBet.toFixed(2)}`, "win"); 
    }
    else if (pS === dS) { 
        balance += currentBet; 
        endGame("EMPATE", "tie"); 
    }
    else { 
        endGame(`PERDISTE -$${currentBet.toFixed(2)}`, "lose"); 
    }
}

function endGame(msg, status) {
    const msgEl = document.getElementById('message');
    msgEl.innerText = msg;
    msgEl.style.color = status === 'win' ? "#00ff00" : (status === 'lose' ? "#ff4444" : "#ffd700");
    
    if (status === 'win') {
        playSfx('win');
        vibrate([100, 50, 100, 50, 300]); // Vibración de éxito
    } else if (status === 'lose') {
        playSfx('lose');
        vibrate(400); // Vibración larga de derrota
    }

    document.getElementById('betting-ui').style.display = "block";
    document.getElementById('game-ui').style.display = "none";
    currentBet = 0;
    saveToStorage();
    updateUI();
}

updateUI();