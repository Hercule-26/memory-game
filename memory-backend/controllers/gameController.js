
const Game = require("../model/Game");
const games = new Map();
const { getSocketByUsername } = require("../sockets/socket");

function generateUniqueGameId() {
  let id;
  do {
    id = Math.floor(100000 + Math.random() * 900000).toString();
  } while (games.has(id));
  return id;
}

const createGame = async (req, res) => {
  try {
    const playerUsername = req.session.username;
    const gameId = generateUniqueGameId();
    const gameName = req.body.gameName;
    if (!gameName) {
      return res.status(400).json("Game Name is missing");
    }
    const game = new Game(gameName, playerUsername);
    games.set(gameId, game);
    req.session.gameId = gameId;
    res.status(201).json({
      gameId: gameId,
      game: game,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Error while creating the game" });
  }
};

const getGame = async (req, res) => {
  const gameId = req.params.id;

  if (!games.has(gameId)) {
    return res.status(404).json({ error: "Game not found" });
  }
  const game = games.get(gameId);
  res.status(200).json(game);
};

const joinGame = async (req, res) => {
  const gameId = req.params.id;
  console.log(gameId);
  
  if (!gameId) {
    return res.status(400).json("Game Id is missing");
  }
  if(!gameExist(gameId)) {
    return res.status(404).json("Game not found");
  }
  const game = games.get(gameId);
  if(game.gameIsFull()) {
    return res.status(400).json("Game is full");
  }
  game.addPlayer(req.session.username);
  req.session.gameId = gameId;
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
    getGame,
    gameExist,
};
