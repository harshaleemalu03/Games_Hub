'use strict';

// Canvas setup
const canvas = document.getElementById('tetris-canvas');
const context = canvas.getContext('2d');
context.scale(20, 20);

// DOM elements for buttons & displays
const leftBtn = document.getElementById('left-btn');
const rightBtn = document.getElementById('right-btn');
const rotateBtn = document.getElementById('rotate-btn');
const dropBtn = document.getElementById('drop-btn');
const pauseBtn = document.getElementById('pause-btn');

const difficultySelector = document.getElementById('difficulty-select');
const scoreDisplay = document.getElementById('score-display');
const levelDisplay = document.getElementById('level-display');
const finalScoreDisplay = document.getElementById('final-score');
const finalLevelDisplay = document.getElementById('final-level');

const mainMenu = document.getElementById('main-menu');
const gameScreen = document.getElementById('game-screen');
const gameOverScreen = document.getElementById('game-over');
const settingsScreen = document.getElementById('settings-screen');
const highscoresScreen = document.getElementById('highscores-screen');
const helpScreen = document.getElementById('help-screen');
const pauseScreen = document.getElementById('pause-screen');

const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const menuBtn = document.getElementById('menu-btn');
const backBtn = document.getElementById('back-btn');
const helpBtn = document.getElementById('help-btn');
const helpBackBtn = document.getElementById('help-back-btn');
const resumeBtn = document.getElementById('resume-btn');
const quitBtn = document.getElementById('quit-btn');
const settingsBtn = document.getElementById('settings-btn');
const saveSettingsBtn = document.getElementById('save-settings-btn');

// Difficulty settings mapped to drop interval (ms)
const difficultySettings = {
  easy: 1000,
  moderate: 600,
  difficult: 300
};

let dropInterval = difficultySettings['moderate']; // default
let lastTime = 0;
let dropCounter = 0;
let score = 0;
let level = 1;
let linesCleared = 0;
let isPaused = false;

// Colors for the pieces (index match piece number)
const colors = [
  null,
  '#FF0D72', // T
  '#0DC2FF', // O
  '#0DFF72', // L
  '#F538FF', // J
  '#FF8E0D', // I
  '#FFE138', // S
  '#3877FF'  // Z
];

// Arena matrix 12 x 20
function createMatrix(w, h) {
  const matrix = [];
  while (h--) {
    matrix.push(new Array(w).fill(0));
  }
  return matrix;
}

const arenaWidth = 12;
const arenaHeight = 20;
let arena = createMatrix(arenaWidth, arenaHeight);

// Pieces shapes
function createPiece(type) {
  switch(type) {
    case 'T': return [
      [0, 0, 0],
      [1, 1, 1],
      [0, 1, 0]
    ];
    case 'O': return [
      [2, 2],
      [2, 2]
    ];
    case 'L': return [
      [0, 3, 0],
      [0, 3, 0],
      [0, 3, 3]
    ];
    case 'J': return [
      [0, 4, 0],
      [0, 4, 0],
      [4, 4, 0]
    ];
    case 'I': return [
      [0, 5, 0, 0],
      [0, 5, 0, 0],
      [0, 5, 0, 0],
      [0, 5, 0, 0]
    ];
    case 'S': return [
      [0, 6, 6],
      [6, 6, 0],
      [0, 0, 0]
    ];
    case 'Z': return [
      [7, 7, 0],
      [0, 7, 7],
      [0, 0, 0]
    ];
  }
}

function drawMatrix(matrix, offset) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        context.fillStyle = colors[value];
        context.fillRect(x + offset.x, y + offset.y, 1, 1);
      }
    });
  });
}

function draw() {
  context.fillStyle = '#000';
  context.fillRect(0, 0, canvas.width, canvas.height);

  drawMatrix(arena, {x:0, y:0});
  drawMatrix(player.matrix, player.pos);
}

// Collision detection
function collide(arena, player) {
  const [m, o] = [player.matrix, player.pos];
  for (let y=0; y<m.length; ++y) {
    for (let x=0; x<m[y].length; ++x) {
      if (m[y][x] !== 0 &&
          (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
        return true;
      }
    }
  }
  return false;
}

// Merge player piece into arena on drop
function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        arena[y + player.pos.y][x + player.pos.x] = value;
      }
    });
  });
}

// Clear completed rows and update score
function arenaSweep() {
  let rowCount = 1;
  outer: for (let y = arena.length -1; y >= 0; --y) {
    for (let x=0; x < arena[y].length; ++x) {
      if (arena[y][x] === 0) {
        continue outer;
      }
    }
    // Remove this row and add empty on top
    const row = arena.splice(y, 1)[0].fill(0);
    arena.unshift(row);
    y++;
    // Update score and lines cleared
    score += rowCount * 10; // Increase points per cleared line
    linesCleared++;
    if (linesCleared % 10 === 0) {
      level++;
      // Increase speed on level up with minimum cap
      dropInterval = Math.max(100, dropInterval - 50);
    }
    rowCount *= 2; // Double points for multiple lines cleared at once
  }
  updateScoreLevel();
}

function updateScoreLevel() {
  scoreDisplay.textContent = 'SCORE: ' + score.toString().padStart(5, '0');
  levelDisplay.textContent = 'LEVEL: ' + level.toString().padStart(2, '0');
}

// Player Object
const player = {
  pos: {x:0, y:0},
  matrix: null,
};

// Reset player to a new piece and initial position
function playerReset() {
  const pieces = 'TJLOSZI';
  player.matrix = createPiece(pieces[Math.floor(Math.random()*pieces.length)]);
  player.pos.y = 0;
  player.pos.x = (arena[0].length / 2 | 0) -
                 (player.matrix[0].length / 2 | 0);
  if (collide(arena, player)) {
    // Arena full - game over
    gameOver();
    return;
  }
}

// Player drop
function playerDrop() {
  player.pos.y++;
  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    arenaSweep();
    playerReset();
  }
  dropCounter = 0;
}

// Player move left/right
function playerMove(dir) {
  player.pos.x += dir;
  if (collide(arena, player)) {
    player.pos.x -= dir;
  }
}

// Rotate matrix helper
function rotate(matrix, dir) {
  for (let y=0; y<matrix.length; ++y) {
    for (let x=0; x<y; ++x) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }
  if (dir > 0) {
    matrix.forEach(row => row.reverse());
  } else {
    matrix.reverse();
  }
}

// Player rotate piece
function playerRotate(dir) {
  const pos = player.pos.x;
  let offset = 1;
  rotate(player.matrix, dir);
  while (collide(arena, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix[0].length) {
      rotate(player.matrix, -dir);
      player.pos.x = pos;
      return;
    }
  }
}

// Pause/resume toggle
function togglePause() {
  isPaused = !isPaused;
  if (isPaused) {
    pauseScreen.classList.remove('hidden');
  } else {
    pauseScreen.classList.add('hidden');
    lastTime = performance.now();
    update();
  }
}

// Main update loop
function update(time = 0) {
  if (isPaused) return;
  const deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;
  if (dropCounter > dropInterval) {
    playerDrop();
  }
  draw();
  requestAnimationFrame(update);
}

// Game Over handler
function gameOver() {
  isPaused = true;
  updateFinalScores();
  gameScreen.classList.add('hidden');
  gameOverScreen.classList.remove('hidden');
}

// Update final scores on Game Over screen
function updateFinalScores() {
  finalScoreDisplay.textContent = score.toString().padStart(5, '0');
  finalLevelDisplay.textContent = level.toString().padStart(2, '0');
}

// Difficulty handling
function updateDifficulty() {
  const level = difficultySelector.value;
  localStorage.setItem('difficulty', level);
  dropInterval = difficultySettings[level];
}

// Save and load difficulty
function loadDifficulty() {
  const saved = localStorage.getItem('difficulty');
  if(saved && difficultySettings[saved]) {
    difficultySelector.value = saved;
  } else {
    difficultySelector.value = 'moderate';
  }
  updateDifficulty();
}

// Setup button event listeners
function setupButtons() {
  leftBtn.addEventListener('click', () => {
    if (!isPaused) playerMove(-1);
  });

  rightBtn.addEventListener('click', () => {
    if (!isPaused) playerMove(1);
  });

  rotateBtn.addEventListener('click', () => {
    if (!isPaused) playerRotate(1);
  });

  dropBtn.addEventListener('click', () => {
    if (!isPaused) playerDrop();
  });

  pauseBtn.addEventListener('click', () => {
    togglePause();
  });

  difficultySelector.addEventListener('change', () => {
    updateDifficulty();
  });

  // Start Game button (from main menu)
  startBtn.addEventListener('click', () => {
    mainMenu.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    settingsScreen.classList.add('hidden');
    highscoresScreen.classList.add('hidden');
    helpScreen.classList.add('hidden');
    pauseScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    resetGame();
  });

  restartBtn.addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    resetGame();
  });

  menuBtn.addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    gameScreen.classList.add('hidden');
    settingsScreen.classList.add('hidden');
    highscoresScreen.classList.add('hidden');
    helpScreen.classList.add('hidden');
    pauseScreen.classList.add('hidden');
    mainMenu.classList.remove('hidden');
  });

  backBtn.addEventListener('click', () => {
    highscoresScreen.classList.add('hidden');
    mainMenu.classList.remove('hidden');
  });

  helpBtn.addEventListener('click', () => {
    mainMenu.classList.add('hidden');
    helpScreen.classList.remove('hidden');
  });

  helpBackBtn.addEventListener('click', () => {
    helpScreen.classList.add('hidden');
    mainMenu.classList.remove('hidden');
  });

  resumeBtn.addEventListener('click', () => {
    togglePause();
  });

  quitBtn.addEventListener('click', () => {
    togglePause();
    gameScreen.classList.add('hidden');
    pauseScreen.classList.add('hidden');
    mainMenu.classList.remove('hidden');
  });

  settingsBtn.addEventListener('click', () => {
    mainMenu.classList.add('hidden');
    settingsScreen.classList.remove('hidden');
  });

  saveSettingsBtn.addEventListener('click', () => {
    // For now, just save difficulty selection
    updateDifficulty();
    settingsScreen.classList.add('hidden');
    mainMenu.classList.remove('hidden');
  });
}

// Reset game state
function resetGame() {
  arena = createMatrix(arenaWidth, arenaHeight);
  playerReset();
  score = 0;
  level = 1;
  linesCleared = 0;
  dropInterval = difficultySettings[difficultySelector.value];
  updateScoreLevel();
  isPaused = false;
  lastTime = performance.now();
  update();
}

// Keyboard controls
document.addEventListener('keydown', event => {
  if (isPaused) return;

  if (event.key === 'ArrowLeft') {
    playerMove(-1);
  } else if (event.key === 'ArrowRight') {
    playerMove(1);
  } else if (event.key === 'ArrowDown') {
    playerDrop();
  } else if (event.key === 'q' || event.key === 'Q') {
    playerRotate(-1);
  } else if (event.key === 'w' || event.key === 'W') {
    playerRotate(1);
  } else if(event.key.toLowerCase() === 'p') {
    togglePause();
  } else if(event.key === ' ') {
    // Hard drop: move down until collision
    while (!collide(arena, player)) {
      player.pos.y++;
    }
    player.pos.y--;
    merge(arena, player);
    arenaSweep();
    playerReset();
    dropCounter = 0;
  }
});

// Initialize game after DOM loaded
window.onload = () => {
  loadDifficulty();
  setupButtons();
  mainMenu.classList.remove('hidden');
};
