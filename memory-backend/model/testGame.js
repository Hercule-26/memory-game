const Game = require("./Game");

function testGame() {
  console.log('🧪 Initialisation du jeu...');
  const game = new Game('Test Party', 'Alice');

  console.log('🙋‍♀️ Joueur actuel :', game.getCurrentPlayer().name);
  game.addPlayer('Bob');
  console.log('👥 Joueurs :', game.players.map(p => p.name).join(', '));

  console.log('🧠 Révélation de deux cartes : (0,0) et (0,1)');
  game.revealCard(0, 0);
  game.revealCard(0, 1);

  const isMatch = game.checkMatch(0, 0, 0, 1);
  console.log(isMatch ? '✅ Match trouvé !' : '❌ Pas un match.');

  console.log('📊 Score Alice :', game.players[0].score);
  console.log('📊 Score Bob :', game.players[1].score);
  console.log('👾 Partie terminée ?', game.isGameOver());

  console.log('🔁 Répétition jusqu’à fin de partie...');

  let tries = 0;
  for (let x1 = 0; x1 < 4; x1++) {
    for (let y1 = 0; y1 < 4; y1++) {
      for (let x2 = 0; x2 < 4; x2++) {
        for (let y2 = 0; y2 < 4; y2++) {
          if ((x1 !== x2 || y1 !== y2) && !game.board[x1][y1].isMatched && !game.board[x2][y2].isMatched) {
            game.revealCard(x1, y1);
            game.revealCard(x2, y2);
            game.checkMatch(x1, y1, x2, y2);
            tries++;
            if (game.isGameOver()) {
              console.log('🎉 Fin du jeu après', tries, 'tentatives.');
              console.log('🏆 Scores finaux :');
              game.players.forEach(p => console.log(`${p.name}: ${p.score}`));
              return;
            }
          }
        }
      }
    }
  }
}

testGame();
