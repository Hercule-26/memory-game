const { getSocketByUserId } = require("../sockets/socket");

const Game = require("../model/Game");
const games = new Map();

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
    console.error(err);
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
  const ws = getSocketByUserId(player1.name);
  
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

const quitGame = async (req, res) => {
  delete req.session.gameId;
  const gameId = req.params.gameId;
  const playerId = req.params.playerId;
  playerDisconnect(gameId, playerId);
  res.status(200).json("Player quit the game");
};

const playerDisconnect = (gameId, playerId) => {
  gameId = gameId.toString();
  if(games.has(gameId)) {
    const game = games.get(gameId);
    const players = game.getPlayers();

    game.deletePlayer(playerId);
    notifyOtherPlayer(players, playerId, {type: "playerDisconnected"});
    
    if(players.length == 0) {
      games.delete(gameId);
    }
  }
}

const gameExist = (gameId) => {  
  return games.has(gameId);
}

const revealCard = async (req, res) => {
  const gameId = req.session.gameId;
  const username = req.session.username;
  const rowIndex = req.params.rowIndex;
  const colIndex = req.params.colIndex;
  
  if(!gameId) {
    return res.status(400).json("Missing gameId in your session. Make sure you are in a game");
  }
  
  if(!username) {
    return res.status(400).json("Missing username in your session. Make sure you are connected");
  }

  if(!gameExist(gameId)) {
    return res.status(404).json("Game does not exist.");
  }

  if (isNaN(rowIndex) || isNaN(colIndex)) {
    return res.status(400).json("rowIndex and colIndex must be valid integers.");
  }
  
  const game = games.get(gameId);

  try {
    const payload = game.revealCard(rowIndex, colIndex);
    if(payload.errorMessage) {
      return res.status(400).json(payload.errorMessage);
    }
    payload.type = "cardRevealed";
    notifyOtherPlayer(game.getPlayers(), username, payload);
    return res.status(200).json(payload);
  } catch (err) {
    console.error("Error while revealing card:", err);
    return res.status(500).json("Internal server error.");
  }
}

const checkCardsMatch = async (req, res) => {
  const gameId = req.session.gameId;
  const username = req.session.username;
  console.log(`gameId : ${gameId}, game existe : ${gameExist(gameId)}`);

  if(!gameId) {
    return res.status(400).json("Missing gameId in your session. Make sure you are in a game");
  }
  
  if(!username) {
    return res.status(400).json("Missing username in your session. Make sure you are connected");
  }

  const game = games.get(gameId);
  const payload = game.checkMatch();
  if(payload.errorMessage) {
    return res.status(400).json(payload.errorMessage);
  } else {
    payload.type = "checkCardsMatch"
    notifyOtherPlayer(game.getPlayers(), username, payload);
    return res.status(200).json(payload);
  }
}

function notifyOtherPlayer(players, currentPlayer, payload) {
  const otherPlayer = players.find((p) => p.name !== currentPlayer);
  if (otherPlayer) {
    const playerSocket = getSocketByUserId(otherPlayer.name);
    if (playerSocket) {
      playerSocket.send(JSON.stringify(payload));
    }
  }
}

module.exports = {
    createGame, 
    joinGame,
    getGame,
    gameExist,
    quitGame,
    playerDisconnect,
    revealCard,
    checkCardsMatch
};
