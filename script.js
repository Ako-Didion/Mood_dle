// List of 5-letter mood/emotion words
const MOODS = [
    'HAPPY', 'ANGRY', 'JOLLY', 'MOODY', 'CALM',
    'WEARY', 'GIDDY', 'TENSE', 'PERKY', 'GLUM',
    'LIVID', 'MERRY', 'SOBER', 'JUMPY', 'CROSS',
    'PEPPY', 'LOOPY', 'WACKY', 'ZESTY', 'POUTY',
    'MUSHY', 'PANICKY', 'SUNNY', 'GRUMPY', 'FEISTY'
];

// Game state
let targetWord = '';
let currentRow = 0;
let currentTile = 0;
let gameOver = false;
const MAX_TRIES = 6;
const WORD_LENGTH = 5;

// Keyboard layout
const keys = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK']
];

// Initialize game
function initGame() {
    targetWord = MOODS[Math.floor(Math.random() * MOODS.length)];
    currentRow = 0;
    currentTile = 0;
    gameOver = false;
    
    // Clear message
    document.getElementById('message').textContent = '';
    document.getElementById('message').className = 'message';
    
    // Create game board
    createBoard();
    
    // Create keyboard
    createKeyboard();
    
    // Add keyboard event listeners
    document.addEventListener('keydown', handleKeyPress);
    
    console.log('Target word:', targetWord); // For testing
}

function createBoard() {
    const gameBoard = document.getElementById('gameBoard');
    gameBoard.innerHTML = '';
    
    for (let i = 0; i < MAX_TRIES; i++) {
        const row = document.createElement('div');
        row.className = 'row';
        
        for (let j = 0; j < WORD_LENGTH; j++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.id = `tile-${i}-${j}`;
            row.appendChild(tile);
        }
        
        gameBoard.appendChild(row);
    }
}

function createKeyboard() {
    const keyboard = document.getElementById('keyboard');
    keyboard.innerHTML = '';
    
    keys.forEach(row => {
        const keyboardRow = document.createElement('div');
        keyboardRow.className = 'keyboard-row';
        
        row.forEach(key => {
            const keyButton = document.createElement('button');
            keyButton.className = 'key';
            keyButton.textContent = key;
            keyButton.id = `key-${key}`;
            
            if (key === 'ENTER' || key === 'BACK') {
                keyButton.classList.add('wide');
            }
            
            keyButton.addEventListener('click', () => handleKeyClick(key));
            keyboardRow.appendChild(keyButton);
        });
        
        keyboard.appendChild(keyboardRow);
    });
}

function handleKeyPress(e) {
    if (gameOver) return;
    
    const key = e.key.toUpperCase();
    
    if (key === 'ENTER') {
        submitGuess();
    } else if (key === 'BACKSPACE') {
        deleteLetter();
    } else if (/^[A-Z]$/.test(key)) {
        addLetter(key);
    }
}

function handleKeyClick(key) {
    if (gameOver) return;
    
    if (key === 'ENTER') {
        submitGuess();
    } else if (key === 'BACK') {
        deleteLetter();
    } else {
        addLetter(key);
    }
}

function addLetter(letter) {
    if (currentTile < WORD_LENGTH) {
        const tile = document.getElementById(`tile-${currentRow}-${currentTile}`);
        tile.textContent = letter;
        tile.classList.add('filled');
        currentTile++;
    }
}

function deleteLetter() {
    if (currentTile > 0) {
        currentTile--;
        const tile = document.getElementById(`tile-${currentRow}-${currentTile}`);
        tile.textContent = '';
        tile.classList.remove('filled');
    }
}

function submitGuess() {
    if (currentTile !== WORD_LENGTH) {
        showMessage('Not enough letters!', 'error');
        return;
    }
    
    // Get the guessed word
    let guess = '';
    for (let i = 0; i < WORD_LENGTH; i++) {
        const tile = document.getElementById(`tile-${currentRow}-${i}`);
        guess += tile.textContent;
    }
    
    // Check if it's a valid mood word
    if (!MOODS.includes(guess)) {
        showMessage('Not a valid mood word!', 'error');
        shakeTiles();
        return;
    }
    
    // Check the guess and color tiles
    checkGuess(guess);
    
    // Check if won
    if (guess === targetWord) {
        gameOver = true;
        showMessage('Congratulations! 🎉', 'success');
        return;
    }
    
    // Move to next row
    currentRow++;
    currentTile = 0;
    
    // Check if lost
    if (currentRow === MAX_TRIES) {
        gameOver = true;
        showMessage(`Game Over! The word was ${targetWord}`, 'error');
    }
}

function checkGuess(guess) {
    const targetLetters = targetWord.split('');
    const guessLetters = guess.split('');
    const letterStatus = new Array(WORD_LENGTH).fill('absent');
    const letterCount = {};
    
    // Count letters in target word
    targetLetters.forEach(letter => {
        letterCount[letter] = (letterCount[letter] || 0) + 1;
    });
    
    // First pass: mark correct letters
    for (let i = 0; i < WORD_LENGTH; i++) {
        if (guessLetters[i] === targetLetters[i]) {
            letterStatus[i] = 'correct';
            letterCount[guessLetters[i]]--;
        }
    }
    
    // Second pass: mark present letters
    for (let i = 0; i < WORD_LENGTH; i++) {
        if (letterStatus[i] === 'absent' && 
            targetLetters.includes(guessLetters[i]) && 
            letterCount[guessLetters[i]] > 0) {
            letterStatus[i] = 'present';
            letterCount[guessLetters[i]]--;
        }
    }
    
    // Apply colors to tiles with animation
    for (let i = 0; i < WORD_LENGTH; i++) {
        setTimeout(() => {
            const tile = document.getElementById(`tile-${currentRow}-${i}`);
            tile.classList.add(letterStatus[i]);
            updateKeyboard(guessLetters[i], letterStatus[i]);
        }, i * 300);
    }
}

function updateKeyboard(letter, status) {
    const key = document.getElementById(`key-${letter}`);
    if (!key) return;
    
    // Don't downgrade a correct key to present or absent
    if (key.classList.contains('correct')) return;
    if (status === 'present' && key.classList.contains('present')) return;
    
    key.classList.remove('correct', 'present', 'absent');
    key.classList.add(status);
}

function shakeTiles() {
    const tiles = document.querySelectorAll(`#tile-${currentRow}-0, #tile-${currentRow}-1, #tile-${currentRow}-2, #tile-${currentRow}-3, #tile-${currentRow}-4`);
    tiles.forEach(tile => {
        tile.style.animation = 'shake 0.5s';
        setTimeout(() => {
            tile.style.animation = '';
        }, 500);
    });
}

function showMessage(text, type = '') {
    const messageEl = document.getElementById('message');
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
    
    setTimeout(() => {
        if (!gameOver) {
            messageEl.textContent = '';
            messageEl.className = 'message';
        }
    }, 2000);
}

// Modal functionality
const modal = document.getElementById('modal');
const howToPlayBtn = document.getElementById('howToPlayBtn');
const closeBtn = document.getElementsByClassName('close')[0];

howToPlayBtn.onclick = function() {
    modal.style.display = 'block';
}

closeBtn.onclick = function() {
    modal.style.display = 'none';
}

window.onclick = function(event) {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// New game button
document.getElementById('newGameBtn').addEventListener('click', initGame);

// Add shake animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

// Start the game
initGame();
