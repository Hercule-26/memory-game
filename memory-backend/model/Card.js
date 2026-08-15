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

  isVisible() {
    return this.isRevealed || this.isMatched;
  }

  toPublic() {
    return {
      value: this.isVisible() ? this.value : null,
      isRevealed: this.isRevealed,
      isMatched: this.isMatched,
    };
  }
}

module.exports = Card;
