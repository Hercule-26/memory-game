class Player {
  constructor(name) {
    this.name = name;
    this.score = 0;
  }

  incrementScore() {
    this.score += 1;
  }
}

module.exports = Player;
