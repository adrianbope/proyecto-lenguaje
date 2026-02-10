const wheelOrder = [0, 28, 9, 26, 30, 11, 7, 20, 32, 17, 5, 22, 34, 15, 3, 24, 36, 13, 1, "00", 27, 10, 25, 29, 12, 8, 19, 31, 18, 6, 21, 33, 16, 4, 23, 35, 14, 2];
const redNums = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

let balance = parseFloat(localStorage.getItem('roulette_balance')) || 1000;
let activeBets = []; // Array de objetos { type: 'single|split|corner', value: [1,2], amount: 100, x, y }
let selectedChipValue = 100;
let isSpinning = false;

function init() {
    const wheel = document.getElementById('wheel');
    const grid = document.getElementById('numbers-grid');
    
    // 1. Dibujar Ruleta
    wheelOrder.forEach((num, i) => {
        const slot = document.createElement('div');
        slot.className = 'slot';
        const color = (num === 0 || num === "00") ? '#059669' : (redNums.includes(num) ? '#dc2626' : '#1a1a1a');
        slot.style.transform = `translate(-50%, 0) rotate(${i * (360/38)}deg)`;
        slot.style.background = `linear-gradient(to bottom, ${color} 35px, transparent 35px)`;
        slot.innerHTML = num;
        wheel.appendChild(slot);
    });

    // 2. Generar Tapete y Sensores de Colisión
    for (let col = 1; col <= 12; col++) {
        for (let row = 3; row >= 1; row--) {
            let num = (col - 1) * 3 + row;
            const cell = document.createElement('div');
            cell.className = `num-cell ${redNums.includes(num) ? 'num-red' : 'num-black'}`;
            cell.innerHTML = num;
            cell.dataset.num = num;
            cell.onclick = (e) => handleGridClick(e, num, col, row);
            grid.appendChild(cell);
        }
    }
    updateUI();
}

function selectChip(val, el) {
    selectedChipValue = val;
    document.querySelectorAll('.chip-item').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
}

// Esta función detecta si clickeas en el centro, en una línea (split) o en una esquina (corner)
function handleGridClick(e, num, col, row) {
    if (isSpinning) return;
    
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const w = rect.width;
    const h = rect.height;

    let betType = 'single';
    let betNumbers = [num];
    
    // Umbral para detectar bordes (px)
    const threshold = 10;

    // Lógica de detección de posición
    const isLeft = x < threshold && col > 1;
    const isTop = y < threshold && row < 3;

    if (isLeft && isTop) {
        betType = 'corner';
        betNumbers = [num, num+1, num-3, num-2];
    } else if (isLeft) {
        betType = 'split';
        betNumbers = [num, num-3];
    } else if (isTop) {
        betType = 'split';
        betNumbers = [num, num+1];
    }

    placeBet(betNumbers, e, betType);
}

function placeBet(nums, event, type = 'single') {
    if (balance < selectedChipValue) return alert("Saldo insuficiente");

    balance -= selectedChipValue;
    
    // Crear visual de la ficha
    const chip = document.createElement('div');
    chip.className = 'chip-on-board';
    chip.innerText = selectedChipValue;
    chip.style.left = `${event.pageX}px`;
    chip.style.top = `${event.pageY}px`;
    chip.style.position = 'absolute';
    document.body.appendChild(chip);

    activeBets.push({
        numbers: Array.isArray(nums) ? nums : [nums],
        amount: selectedChipValue,
        type: type,
        element: chip
    });

    localStorage.setItem('roulette_balance', balance);
    updateUI();
}

function spin() {
    if (isSpinning || activeBets.length === 0) return;
    isSpinning = true;

    const wheel = document.getElementById('wheel');
    const randomRotation = 1800 + Math.floor(Math.random() * 360);
    wheel.style.transform = `rotateX(45deg) rotate(${randomRotation}deg)`;

    setTimeout(() => {
        const finalDeg = randomRotation % 360;
        const index = Math.floor(((360 - finalDeg) + (360/38/2)) % 360 / (360/38));
        const winNum = wheelOrder[index];
        resolveBets(winNum);
    }, 5000);
}

function resolveBets(winNum) {
    let totalWin = 0;
    
    activeBets.forEach(bet => {
        if (bet.numbers.includes(winNum) || bet.numbers.includes(winNum.toString())) {
            let multiplier = 35; 
            if (bet.type === 'split') multiplier = 17;
            if (bet.type === 'corner') multiplier = 8;
            
            totalWin += bet.amount + (bet.amount * multiplier);
        }
    });

    balance += totalWin;
    document.getElementById('res-msg').innerText = `SALIÓ EL ${winNum}. GANASTE: $${totalWin}`;
    
    // Limpiar para la siguiente ronda
    setTimeout(() => {
        clearBets(false);
        isSpinning = false;
        updateUI();
    }, 3000);
}

function clearBets(refund = true) {
    if (isSpinning) return;
    activeBets.forEach(bet => {
        if (refund) balance += bet.amount;
        bet.element.remove();
    });
    activeBets = [];
    updateUI();
}

function updateUI() {
    document.getElementById('balance-display').innerText = `Saldo: $${balance.toFixed(2)}`;
}

window.onload = init;