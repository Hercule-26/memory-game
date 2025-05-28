
const Game = require("../model/Game");
const games = new Map();
const { getSocketByUsername } = require("../sockets/socket");

const createGame = async (req, res) => {
  try {
    const playerUsername = req.session.username;
    const gameId = req.body.gameId;
    if (!gameId) {
      return res.status(400).json("Game Id is missing");
    }
    if (games.has(gameId)) {
      return res.status(400).json(`Game with name '${gameId}' already exists`);
    }
    const game = new Game(gameId, playerUsername);
    games.set(gameId, game);
    req.session.game = game; 
    res.status(201).json({
      game: game,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Error while creating the game" });
  }
};

const joinGame = async (req, res) => {
  const gameId = req.body.gameId;
  if (!gameId) {
    return res.status(400).json("Game Id is missing");
  }
  if(!gameExist(gameId)) {
    return res.status(400).json("Game not found");
  }
  const game = games.get(gameId);
  if(game.gameIsFull()) {
    return res.status(400).json("Game is full");
  }
  game.addPlayer(req.session.username);
  req.session.game = game;
  const player1 = game.players[0];
  const player2 = game.players[1];
  const ws = getSocketByUsername(player1.name);
  if(!ws) {
    console.error("Error with socker (socket not found)");
    return res.status(500).json("Error with socker");
  }
  const payload = {
    type: "playerJoined",
    player: player2
  };
  ws.send(JSON.stringify(payload));
  res.status(200).json({
    game: game,
  });
};

const gameExist = (gameName) => {  
  return games.get(gameName) !== undefined;
}

module.exports = {
    createGame, 
    joinGame,
    gameExist,
};
