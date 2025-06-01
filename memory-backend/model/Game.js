const Player = require('./Player');
const Card = require('./Card');

class Game {
  constructor(partyName, playerName) {
    this.partyName = partyName;
    this.gameIsOver = false;
    this.nbCardRevealed = 0;
    this.revealedCards = [];
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
    if(this.nbCardRevealed == 2) return { errorMessage: "2 cards are already revealed" }

    const card = this.board[x][y];
    card.reveal();
    this.nbCardRevealed++;
    this.revealedCards.push({ 
      x: x, 
      y: y, 
      card: card
    });

    return {
      rowIndex : x,
      colIndex: y,
      card: card,
      nbCardRevealed: this.nbCardRevealed,
    }
  }

  checkMatch() {
    if(this.revealedCards.length < 2) return { errorMessage: "Need to have 2 revealed cards to see if they match each other" };
    
    const card1 = this.revealedCards[0];
    const card2 = this.revealedCards[1];

    if (card1.card.isMatched || card2.card.isMatched || !card1.card.isRevealed || !card2.card.isRevealed) {
      return { errorMessage: "Cards are already matched or are not revealed yet" };
    }

    if (card1.card.value === card2.card.value) {
      card1.card.match();
      card2.card.match();
      this.getCurrentPlayer().incrementScore();
      this.matchedPairs++;
    } else {
      card1.card.hide();
      card2.card.hide();
      this.switchPlayer();
    }
    
    this.nbCardRevealed = 0;
    this.revealedCards = [];
    this.isGameOver();
    
    return {
      card1: card1,
      card2: card2,
      currentPlayerIndex: this.currentPlayerIndex,
      players: this.players,
      totalPairs: this.totalPairs,
      matchedPairs: this.matchedPairs,
      gameIsOver: this.gameIsOver,
      nbCardRevealed: this.nbCardRevealed,
    }
  }

  isGameOver() {
    this.gameIsOver = this.matchedPairs === this.totalPairs;
  }
}

module.exports = Game;
