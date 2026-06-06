// ===== Query DOM ===== and setup area
const cells = document.querySelectorAll(".cell");
const statusText = document.querySelector("#statusText");
const restartBtn = document.querySelector("#restartBtn");
const playerScoreText = document.querySelector("#playerScore");
const aiScoreText = document.querySelector("#aiScore");
const highScoreText = document.querySelector("#highScore");
const bestTimeText = document.querySelector("#bestTime");
const playerNameText = document.querySelector("#playerName");
const changeNameBtn = document.querySelector("#changeNameBtn");
const leaderboardList = document.querySelector("#leaderboardList");

// color buttons
const changeColorBtnTop = document.querySelector("#changeColorBtn");
const changeColorBtnBottom = document.querySelector("#colorBtnBottom");

// difficulty select 
const difficultySelect = document.getElementById("difficultySelect");

// === LocalStorage keys ===
const LS_KEYS = {
  name: "ttt_player_name",
  high: "ttt_high_score",
  bestTime: "ttt_best_time_ms",
  boardFast: "ttt_fastest_leaderboard",
  themeHue: "ttt_theme_hue",
  colorBlindIndex: "ttt_colorblind_index",
  difficulty: "ttt_difficulty",
  playerSymbol: "ttt_player_symbol" // remember X/O
};

// === Win conditions ===
const winConditions = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

// === Game state ===
let options = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "X";
let humanPlayer = "X";
let aiPlayer = "O";
let running = false;
let playerScore = 0;
let aiScore = 0;
let symbolChosen = false; // player must click X/O before play

// === Timer state ===
let roundStartAt = 0;

// === Motion preference ===
const PREFERS_REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// === Persistent state ===
let playerName = loadName();
let allTimeHigh = loadHighScore();
let bestTimeMs = loadBestTime();
let leaderboardFast = loadFastLeaderboard();

// === Difficulty (persisted; defaults to "normal") ===
let difficulty = loadDifficulty();
wireDifficultySelect();

/* ============================
   COLOR-BLIND MODE
   ============================ */
const CB_PALETTES = [
  { name: "Default",      x: "#ff6b6b", o: "#4cd3ff" },
  { name: "Deuteranopia", x: "#f9a602", o: "#0561fc" },
  { name: "Protanopia",   x: "#c24b30", o: "#00857a" },
  { name: "Tritanopia",   x: "#e56dcb", o: "#35c53a" },
  { name: "Monochrome",   x: "#cccccc", o: "#666666" }
];

function applyColorBlindPalette(index){
  const listLen = CB_PALETTES.length;
  const idx = ((index % listLen) + listLen) % listLen;
  const p = CB_PALETTES[idx];
  const root = document.documentElement;
  root.style.setProperty("--x", p.x);
  root.style.setProperty("--o", p.o);
  localStorage.setItem(LS_KEYS.colorBlindIndex, String(idx));
}

function nextColorBlindPalette(){
  const cur = parseInt(localStorage.getItem(LS_KEYS.colorBlindIndex) || "0", 10);
  applyColorBlindPalette((cur + 1) % CB_PALETTES.length);
}

// === Init ===
initializeGame();

// === Persistence helpers ===
function loadName(){
  const n = localStorage.getItem(LS_KEYS.name);
  if (n && n.trim()) return n.trim();
  const ask = prompt("Enter your player name:", "Player") || "Player";
  localStorage.setItem(LS_KEYS.name, ask.trim());
  return ask.trim();
}
function saveName(n){ localStorage.setItem(LS_KEYS.name, n); }

function loadHighScore(){ return Number(localStorage.getItem(LS_KEYS.high) || 0); }
function saveHighScore(v){ localStorage.setItem(LS_KEYS.high, String(v)); }

function loadBestTime(){
  const v = localStorage.getItem(LS_KEYS.bestTime);
  return v ? Number(v) : Infinity;
}
function saveBestTime(ms){ localStorage.setItem(LS_KEYS.bestTime, String(ms)); }

function loadFastLeaderboard(){
  try{
    const raw = localStorage.getItem(LS_KEYS.boardFast);
    return raw ? JSON.parse(raw) : [];
  }catch(e){ return []; }
}
function saveFastLeaderboard(arr){
  localStorage.setItem(LS_KEYS.boardFast, JSON.stringify(arr));
}

function loadDifficulty(){
  const d = localStorage.getItem(LS_KEYS.difficulty);
  return d === "easy" || d === "normal" || d === "hard" ? d : "normal";
}
function saveDifficulty(d){
  localStorage.setItem(LS_KEYS.difficulty, d);
}

function wireDifficultySelect(){
  if (!difficultySelect) return;
  difficultySelect.value = difficulty;
  difficultySelect.addEventListener("change", () => {
    difficulty = difficultySelect.value;
    saveDifficulty(difficulty);
  });
}

// === NEW: symbol choice (no prompts; preserves your token colors) ===
function loadPlayerSymbol(){
  const s = localStorage.getItem(LS_KEYS.playerSymbol);
  return (s === "O") ? "O" : "X"; // default X
}
function savePlayerSymbol(s){
  localStorage.setItem(LS_KEYS.playerSymbol, s);
}

// Use a button-only class that won't collide with your board 
function markSymbolButtons(sym){
  const btnX = document.getElementById("playAsX");
  const btnO = document.getElementById("playAsO");
  if (!btnX || !btnO) return;
  btnX.classList.toggle("is-selected", sym === "X");
  btnO.classList.toggle("is-selected", sym === "O");
}

function wirePlayAsButtons(){
  const btnX = document.getElementById("playAsX");
  const btnO = document.getElementById("playAsO");
  if (!btnX || !btnO) return;

  // show last choice visually (doesn't start yet)
  markSymbolButtons(loadPlayerSymbol());

  const applyChoice = (sym)=>{
    humanPlayer = sym;
    aiPlayer = (sym === "X") ? "O" : "X";
    savePlayerSymbol(sym);
    markSymbolButtons(sym);
    symbolChosen = true;

    // Always give player the first move after choosing
    startNewRoundWithChoice();
  };

  btnX.addEventListener("click", ()=> applyChoice("X"));
  btnO.addEventListener("click", ()=> applyChoice("O"));
}

function renderFastLeaderboard(){
  leaderboardList.innerHTML = "";
  leaderboardFast
    .slice(0, 10)
    .forEach((row, i) => {
      const li = document.createElement("li");
      const date = new Date(row.date).toLocaleString();
      li.textContent = `${i+1}. ${row.name} — ${(row.ms/1000).toFixed(2)}s (on ${date})`;
      leaderboardList.appendChild(li);
    });
}
function renderBestTime(){
  bestTimeText.textContent = isFinite(bestTimeMs) ? (bestTimeMs/1000).toFixed(2) + "s" : "—";
}

// === Utility ===
function setStatus(msg){
  statusText.textContent = msg;
}

function clearBoardVisuals(){
  cells.forEach(cell => {
    cell.textContent = "";
    cell.classList.remove("x","o","filled","placing","win");
    cell.style.boxShadow = "";
    cell.style.filter = "";
  });
}

function highlightWinLine(indices){
  indices.forEach(i => {
    const el = cells[i];
    el.classList.add("win");
    el.style.boxShadow = "inset 0 0 0 2px currentColor, 0 0 20px currentColor";
  });

  if (!PREFERS_REDUCED) {
    let step = 0;
    const pulse = setInterval(()=>{
      step++;
      const on = step % 2 === 1;
      indices.forEach(i => cells[i].style.filter = on ? "brightness(1.25)" : "brightness(1)");
      if (step >= 4) {
        clearInterval(pulse);
        indices.forEach(i => cells[i].style.filter = "");
      }
    }, 250);
  }
}

// === Game setup ===
function initializeGame() {
  statusText.setAttribute("role", "status");
  statusText.setAttribute("aria-live", "polite");

  playerNameText.textContent = playerName;
  highScoreText.textContent = allTimeHigh;
  renderBestTime();

  changeNameBtn.addEventListener("click", () => {
    const n = prompt("Change player name:", playerName) || playerName;
    playerName = n.trim() || "Player";
    playerNameText.textContent = playerName;
    saveName(playerName);
  });

  renderFastLeaderboard();

  cells.forEach((cell, index) => {
    cell.setAttribute("cellIndex", index);
    cell.tabIndex = 0;
    cell.setAttribute("role", "button");
    cell.setAttribute("aria-label", `Board cell ${index+1}`);
    cell.addEventListener("click", cellClicked);
    cell.addEventListener("keydown", e=>{
      if(e.key === "Enter" || e.key === " "){
        e.preventDefault();
        cell.click();
      }
    });
  });

  restartBtn.addEventListener("click", restartGame);

  const root = document.documentElement;
  const applyHue = (h)=>{
    localStorage.setItem(LS_KEYS.themeHue, String(h));
    root.style.setProperty("--accent", `hsl(${h}, 80%, 65%)`);
    root.style.setProperty("--accent-2", `hsl(${(h+200)%360}, 80%, 60%)`);
  };
  const storedHue = Number(localStorage.getItem(LS_KEYS.themeHue));
  if (!Number.isNaN(storedHue)) applyHue(storedHue);

  function randomizeTheme(){
    const h = Math.floor(Math.random()*360);
    applyHue(h);
  }
  if (changeColorBtnTop) changeColorBtnTop.addEventListener("click", randomizeTheme);
  if (changeColorBtnBottom) changeColorBtnBottom.addEventListener("click", randomizeTheme);

  const savedCB = parseInt(localStorage.getItem(LS_KEYS.colorBlindIndex) || "0", 10);
  applyColorBlindPalette(savedCB);

  if (!document.querySelector("#colorBlindBtn")) {
    const cbBtn = document.createElement("button");
    cbBtn.id = "colorBlindBtn";
    cbBtn.textContent = "Color-Blind Mode";
    cbBtn.className = "small";
    cbBtn.style.marginLeft = "6px";
    restartBtn.insertAdjacentElement("afterend", cbBtn);
    cbBtn.addEventListener("click", nextColorBlindPalette);
  }

  // Wire Play-as buttons for X/O setup
  wirePlayAsButtons();
  setStatus("What u wanna play X or O ?");
  running = false; // lock until selection
}

// === Round control ===
function startNewRoundWithChoice(){
  options = ["", "", "", "", "", "", "", "", ""];
  clearBoardVisuals();

  // Require player to choose a symbol first
  if (!symbolChosen) {
    setStatus("What u wanna play X or O ?");
    running = false;
    return;
  }

  // Use saved/selected symbol
  humanPlayer = loadPlayerSymbol();
  aiPlayer = (humanPlayer === "X") ? "O" : "X";

  // Player always starts
  currentPlayer = humanPlayer;
  setStatus("Your turn");

  roundStartAt = performance.now();
  running = true;
}

function startNewRound(){
  // Keep current symbol; re-open a fresh board
  if (!symbolChosen) {
    setStatus("What u wanna play X or O ?");
    running = false;
    return;
  }
  startNewRoundWithChoice();
}

// === Interaction ===
function cellClicked() {
  const cellIndex = this.getAttribute("cellIndex");
  if (!running || !symbolChosen) return;
  if (this.classList.contains("filled")) return;
  if (options[cellIndex] !== "" || currentPlayer !== humanPlayer) return;

  updateCell(this, cellIndex);
  this.classList.add("filled");

  // After human move, resolve win/draw or pass turn to AI
  checkWinner();

  // If still running its Ai's turn
  if (running && currentPlayer === aiPlayer) {
    setTimeout(() => {
      currentPlayer = aiPlayer;
      aiMove();
    }, 250);
  }
}

function updateCell(cell, index) {
  options[index] = currentPlayer;
  cell.textContent = currentPlayer;
  cell.classList.add(currentPlayer.toLowerCase(), "placing"); 
  if (!PREFERS_REDUCED) {
    cell.addEventListener('animationend', () => cell.classList.remove('placing'), { once: true });
  } else {
    cell.classList.remove('placing');
  }
}

function changePlayer() {
  currentPlayer = (currentPlayer === "X") ? "O" : "X";
  setStatus(`${currentPlayer === humanPlayer ? "Player" : "AI"}'s turn`);
}

function checkWinner() {
  let winLine = null;

  for (let i = 0; i < winConditions.length; i++) {
    const [a, b, c] = winConditions[i];
    const cellA = options[a], cellB = options[b], cellC = options[c];
    if (cellA === "" || cellB === "" || cellC === "") continue;
    if (cellA === cellB && cellB === cellC) { winLine = [a, b, c]; break; }
  }

  if (winLine) {
    running = false;
    const humanWon = currentPlayer === humanPlayer;
    setStatus(humanWon ? "Player wins!" : "AI wins!");
    highlightWinLine(winLine);

    if (humanWon) {
      playerScore++;
      playerScoreText.textContent = playerScore;

      if (playerScore > allTimeHigh) {
        allTimeHigh = playerScore;
        highScoreText.textContent = allTimeHigh;
        saveHighScore(allTimeHigh);
      }

      const elapsedMs = Math.max(0, performance.now() - roundStartAt);
      if (elapsedMs < bestTimeMs) {
        bestTimeMs = elapsedMs;
        saveBestTime(bestTimeMs);
        renderBestTime();
      }

      leaderboardFast.push({
        name: playerName,
        ms: elapsedMs,
        date: new Date().toISOString()
      });
      leaderboardFast.sort((a, b) => a.ms - b.ms || new Date(a.date) - new Date(b.date));
      if (leaderboardFast.length > 50) leaderboardFast.length = 50;
      saveFastLeaderboard(leaderboardFast);
      renderFastLeaderboard();

    } else {
      // Keep the board visible and selection intact so the win is shown.
      aiScore++;
      aiScoreText.textContent = aiScore;
      
    }

    return; // stop after a win
  }

  if (!options.includes("")) {
    setStatus("Draw!");
    running = false;
    return; // stops after its draw
  }

  // Otherwise, continue play
  changePlayer();
}

// === AI (with difficulty levels) ===
function aiMove() {
  if (!running) return;

  if (currentPlayer !== aiPlayer) currentPlayer = aiPlayer;

  let bestMove;

  if (difficulty === "easy") {
    // Easy: random move only
    const empty = [];
    options.forEach((v, i) => { if (v === "") empty.push(i); });
    bestMove = empty.length ? empty[Math.floor(Math.random() * empty.length)] : null;
  } else if (difficulty === "normal") {
    // Normal: balanced AI
    bestMove = findBestMove();
  } else {
    // Hard: minimax
    bestMove = findBestMoveAdvanced();
  }

  if (bestMove !== null && bestMove !== undefined) {
    const aiCell = cells[bestMove];
    updateCell(aiCell, bestMove);
    aiCell.classList.add("filled");
    checkWinner();

    // If game continues, pass turn back to player
    if (running) {
      currentPlayer = humanPlayer;
      setStatus("Your turn");
    }
  }
}

// Try to win the ai
function findBestMove() {
  // Win
  for (let i = 0; i < winConditions.length; i++) {
    const [a, b, c] = winConditions[i];
    if (options[a] === aiPlayer && options[b] === aiPlayer && options[c] === "") return c;
    if (options[a] === aiPlayer && options[c] === aiPlayer && options[b] === "") return b;
    if (options[b] === aiPlayer && options[c] === aiPlayer && options[a] === "") return a;
  }
  // Block
  for (let i = 0; i < winConditions.length; i++) {
    const [a, b, c] = winConditions[i];
    if (options[a] === humanPlayer && options[b] === humanPlayer && options[c] === "") return c;
    if (options[a] === humanPlayer && options[c] === humanPlayer && options[b] === "") return b;
    if (options[b] === humanPlayer && options[c] === humanPlayer && options[a] === "") return a;
  }
  // Random
  const empty = [];
  options.forEach((v, i) => { if (v === "") empty.push(i); });
  return empty.length ? empty[Math.floor(Math.random() * empty.length)] : null;
}

// Hard mode same properties
function findBestMoveAdvanced() {
  // Use minimax to find the best possible move
  const best = minimax(options.slice(), aiPlayer, 0, -Infinity, Infinity);
  return best.index;
}

function minimax(board, player, depth, alpha, beta) {
  const term = terminalState(board);
  if (term.done) {
    if (term.winner === aiPlayer) return { score: 10 - depth, index: -1 };
    if (term.winner === humanPlayer) return { score: depth - 10, index: -1 };
    return { score: 0, index: -1 };
  }

  const maximizing = (player === aiPlayer);
  let best = { score: maximizing ? -Infinity : Infinity, index: -1 };

  // Evaluate center to help performance
  const order = [4, 0, 2, 6, 8, 1, 3, 5, 7];
  const moves = order.filter(i => board[i] === "");

  for (const idx of moves) {
    board[idx] = player;

    const nextPlayer = (player === "X") ? "O" : "X";
    const result = minimax(board, nextPlayer, depth + 1, alpha, beta);

    board[idx] = ""; 

    if (maximizing) {
      if (result.score > best.score) best = { score: result.score, index: idx };
      alpha = Math.max(alpha, result.score);
    } else {
      if (result.score < best.score) best = { score: result.score, index: idx };
      beta = Math.min(beta, result.score);
    }

    if (beta <= alpha) break; 
  }

  return best;
}

function terminalState(board) {
  for (let i = 0; i < winConditions.length; i++) {
    const [a, b, c] = winConditions[i];
    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      return { done: true, winner: board[a] };
    }
  }
  if (!board.includes("")) return { done: true, winner: null }; // draw
  return { done: false, winner: null };
}

// === Restart: prompt for X/O again ===
function restartGame() {
  // Restart again
  symbolChosen = false;
  options = ["", "", "", "", "", "", "", "", ""];
  clearBoardVisuals();
  setStatus("What u wanna play X or O ?");
  running = false;
}
