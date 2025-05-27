class Card {
  constructor(value) {
    this.value = value;
    this.isMatched = false;
    this.isRevealed = false;
  }

  reveal() {
    this.isRevealed = true;
  }

  hide() {
    this.isRevealed = false;
  }

  match() {
    this.isMatched = true;
  }
}

module.exports = Card;
