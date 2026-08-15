const Player = require('./Player');
const Card = require('./Card');

const ROWS = 4;
const COLS = 4;
const MAX_PLAYERS = 2;

class Game {
  constructor(partyName, playerName) {
    this.partyName = partyName;
    this.gameIsOver = false;
    this.nbCardRevealed = 0;
    this.revealedCards = [];
    this.players = [new Player(playerName)];
    this.askedToRestart = [];
    this.currentPlayerIndex = 0;
    this.board = this.generateBoard();
    this.matchedPairs = 0;
    this.totalPairs = (ROWS * COLS) / 2;
    this.updatedAt = Date.now();
  }

  generateBoard() {
    const values = [];
    for (let i = 1; i <= (ROWS * COLS) / 2; i++) {
      values.push(i, i);
    }

    for (let i = values.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }

    const board = [];
    for (let row = 0; row < ROWS; row++) {
      board.push(
        values.slice(row * COLS, (row + 1) * COLS).map((value) => new Card(value))
      );
    }
    return board;
  }

  touch() {
    this.updatedAt = Date.now();
  }

  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex] || null;
  }

  getPlayers() {
    return this.players;
  }

  getPlayerNames() {
    return this.players.map((player) => player.name);
  }

  hasPlayer(playerName) {
    return this.players.some((player) => player.name === playerName);
  }

  isFull() {
    return this.players.length >= MAX_PLAYERS;
  }

  gameIsFull() {
    return this.isFull();
  }

  addPlayer(playerName) {
    if (this.isFull()) return { error: 'Game is full' };
    if (this.hasPlayer(playerName)) return { error: 'This username is already in the game' };

    this.players.push(new Player(playerName));
    this.touch();
    return { player: this.players[this.players.length - 1] };
  }

  deletePlayer(playerName) {
    const index = this.players.findIndex((player) => player.name === playerName);
    if (index === -1) return false;

    this.players.splice(index, 1);
    this.cancelPendingReveals();
    this.askedToRestart = this.askedToRestart.filter((name) => name !== playerName);

    if (this.currentPlayerIndex >= this.players.length) {
      this.currentPlayerIndex = 0;
    }
    this.touch();
    return true;
  }

  cancelPendingReveals() {
    for (const revealed of this.revealedCards) {
      if (!revealed.card.isMatched) revealed.card.hide();
    }
    this.revealedCards = [];
    this.nbCardRevealed = 0;
  }

  switchPlayer() {
    if (this.players.length === 0) return;
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
  }

  revealCard(playerName, rawRow, rawCol) {
    const row = Number(rawRow);
    const col = Number(rawCol);

    if (!Number.isInteger(row) || !Number.isInteger(col) || !this.board[row] || !this.board[row][col]) {
      return { error: 'Invalid card position' };
    }
    if (this.gameIsOver) {
      return { error: 'The game is over' };
    }
    if (!this.isFull()) {
      return { error: 'Waiting for a second player' };
    }
    const currentPlayer = this.getCurrentPlayer();
    if (!currentPlayer || currentPlayer.name !== playerName) {
      return { error: "It is not your turn" };
    }
    if (this.revealedCards.length >= 2) {
      return { error: '2 cards are already revealed' };
    }

    const card = this.board[row][col];
    if (card.isMatched || card.isRevealed) {
      return { error: 'This card is already revealed' };
    }

    card.reveal();
    this.revealedCards.push({ x: row, y: col, card });
    this.nbCardRevealed = this.revealedCards.length;
    this.touch();

    return { ok: true, isTurnComplete: this.revealedCards.length === 2 };
  }

  resolveMatch() {
    if (this.revealedCards.length < 2) {
      return { error: 'Need to have 2 revealed cards to see if they match each other' };
    }

    const [first, second] = this.revealedCards;
    const isMatch = first.card.value === second.card.value;

    if (isMatch) {
      first.card.match();
      second.card.match();
      const currentPlayer = this.getCurrentPlayer();
      if (currentPlayer) currentPlayer.incrementScore();
      this.matchedPairs++;
    } else {
      first.card.hide();
      second.card.hide();
      this.switchPlayer();
    }

    this.revealedCards = [];
    this.nbCardRevealed = 0;
    this.gameIsOver = this.matchedPairs === this.totalPairs;
    this.touch();

    return { ok: true, isMatch };
  }

  restartGame(playerName) {
    if (!this.hasPlayer(playerName)) {
      return { error: 'You are not in this game' };
    }
    if (!this.askedToRestart.includes(playerName)) {
      this.askedToRestart.push(playerName);
    }
    this.touch();

    if (this.askedToRestart.length < this.players.length) {
      return { ok: true, restarted: false };
    }

    this.gameIsOver = false;
    this.nbCardRevealed = 0;
    this.revealedCards = [];
    this.board = this.generateBoard();
    this.matchedPairs = 0;
    this.askedToRestart = [];
    this.currentPlayerIndex = 0;
    this.totalPairs = (ROWS * COLS) / 2;
    this.players.forEach((player) => {
      player.score = 0;
    });

    return { ok: true, restarted: true };
  }

  getPublicState() {
    return {
      partyName: this.partyName,
      gameIsOver: this.gameIsOver,
      nbCardRevealed: this.nbCardRevealed,
      currentPlayerIndex: this.currentPlayerIndex,
      matchedPairs: this.matchedPairs,
      totalPairs: this.totalPairs,
      askedToRestart: [...this.askedToRestart],
      players: this.players.map((player) => ({ name: player.name, score: player.score })),
      board: this.board.map((row) => row.map((card) => card.toPublic())),
      isFull: this.isFull(),
    };
  }
}

module.exports = Game;
