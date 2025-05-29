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
  if(games.has(gameId)) {
    const game = games.get(gameId);
    const players = game.getPlayers();

    const otherPlayer = players.find((p) => p.name !== playerId);
    if (otherPlayer) {
      const playerSocket = getSocketByUserId(otherPlayer.name);
      if (playerSocket) {
        playerSocket.send(JSON.stringify({type: "playerDisconnected"}));
      }
    }
    game.deletePlayer(playerId);
    if(players.length == 0) {
      games.delete(gameId);
    }
  }
}

const gameExist = (gameId) => {  
  return games.has(gameId);
}

module.exports = {
    createGame, 
    joinGame,
    getGame,
    gameExist,
    quitGame,
    playerDisconnect,
};
