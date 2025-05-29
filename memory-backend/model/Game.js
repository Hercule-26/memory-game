const Player = require('./Player');
const Card = require('./Card');

class Game {
  constructor(partyName, playerName) {
    this.partyName = partyName;
    this.players = [new Player(playerName)];
    this.currentPlayerIndex = 0;
    this.board = this.generateBoard();
    this.matchedPairs = 0;
    this.totalPairs = (this.board.length * this.board[0].length) / 2;
  }

  generateBoard() {
    const values = [];
    for (let i = 1; i <= 8; i++) {
      values.push(i, i);
    }
    values.sort(() => Math.random() - 0.5); // Shuffle

    const board = [];
    while (values.length) {
      const row = values.splice(0, 4).map(value => new Card(value));
      board.push(row);
    }
    return board;
  }

  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex];
  }
  
  getPlayers() {
    return this.players;
  }

  deletePlayer(playerId) {
    const index = this.players.findIndex(player => player.name === playerId);
    
    if (index !== -1) {
      this.players.splice(index, 1);

      if (this.currentPlayerIndex >= this.players.length) {
        this.currentPlayerIndex = 0;
      }
    }
  }

  addPlayer(playerName) {
    this.players.push(new Player(playerName));
  }

  gameIsFull() {
    return this.players.length == 2;
  }
  
  switchPlayer() {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % 2;
  }

  revealCard(x, y) {
    const card = this.board[x][y];
    card.reveal();
  }

  checkMatch(x1, y1, x2, y2) {
    const card1 = this.board[x1][y1];
    const card2 = this.board[x2][y2];

    if (card1.isMatched || card2.isMatched) {
      return false;
    }

    if (card1.value === card2.value) {
      card1.match();
      card2.match();
      this.getCurrentPlayer().incrementScore();
      this.matchedPairs++;
      return true;
    } else {
      card1.hide();
      card2.hide();
      this.switchPlayer();
      return false;
    }
  }

  isGameOver() {
    return this.matchedPairs === this.totalPairs;
  }
}

module.exports = Game;
