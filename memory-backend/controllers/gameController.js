const { broadcastToUsers } = require('../sockets/socket');

const Game = require('../model/Game');

const games = new Map();
const pendingResolves = new Map();

const FLIP_BACK_MS = Number(process.env.FLIP_BACK_MS || 1500);
const GAME_TTL_MS = Number(process.env.GAME_TTL_MS || 2 * 60 * 60 * 1000);
const GAME_SWEEP_MS = 10 * 60 * 1000;

function generateUniqueGameId() {
  let id;
  do {
    id = Math.floor(100000 + Math.random() * 900000).toString();
  } while (games.has(id));
  return id;
}

function getGameById(gameId) {
  return gameId != null ? games.get(String(gameId)) || null : null;
}

function gameExist(gameId) {
  return gameId != null && games.has(String(gameId));
}

function isUsernameInGame(username) {
  for (const game of games.values()) {
    if (game.hasPlayer(username)) return true;
  }
  return false;
}

function broadcastState(gameId, game, extra = {}) {
  broadcastToUsers(game.getPlayerNames(), {
    type: 'gameState',
    gameId: String(gameId),
    game: game.getPublicState(),
    ...extra,
  });
}

function cancelResolve(gameId) {
  const timer = pendingResolves.get(String(gameId));
  if (timer) {
    clearTimeout(timer);
    pendingResolves.delete(String(gameId));
  }
}

function scheduleResolve(gameId) {
  const key = String(gameId);
  cancelResolve(key);

  const timer = setTimeout(() => {
    pendingResolves.delete(key);
    try {
      const game = games.get(key);
      if (!game) return;
      const result = game.resolveMatch();
      if (result.ok) broadcastState(key, game);
    } catch (err) {
      console.error('Error while resolving a turn:', err);
    }
  }, FLIP_BACK_MS);

  pendingResolves.set(key, timer);
}

const createGame = async (req, res) => {
  const playerUsername = req.session.username;
  const gameName = typeof req.body.gameName === 'string' ? req.body.gameName.trim() : '';

  if (!gameName) {
    return res.status(400).json({ error: 'Game Name is missing' });
  }
  if (gameName.length > 30) {
    return res.status(400).json({ error: 'Game name must be at most 30 characters' });
  }
  if (isUsernameInGame(playerUsername)) {
    return res.status(409).json({ error: 'You are already in a game' });
  }

  const gameId = generateUniqueGameId();
  const game = new Game(gameName, playerUsername);
  games.set(gameId, game);
  req.session.gameId = gameId;

  res.status(201).json({ gameId, game: game.getPublicState() });
};

const getGame = async (req, res) => {
  const gameId = String(req.params.id);
  const game = games.get(gameId);

  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  if (!game.hasPlayer(req.session.username)) {
    return res.status(403).json({ error: 'You are not in this game' });
  }

  res.status(200).json({ gameId, game: game.getPublicState() });
};

const joinGame = async (req, res) => {
  const gameId = String(req.params.id || '');
  const username = req.session.username;

  if (!gameId) {
    return res.status(400).json({ error: 'Game Id is missing' });
  }

  const game = games.get(gameId);
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }

  if (game.hasPlayer(username)) {
    req.session.gameId = gameId;
    return res.status(200).json({ gameId, game: game.getPublicState() });
  }

  if (isUsernameInGame(username)) {
    return res.status(409).json({ error: 'You are already in another game' });
  }

  const result = game.addPlayer(username);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  req.session.gameId = gameId;
  broadcastState(gameId, game, { reason: 'playerJoined', username });

  res.status(200).json({ gameId, game: game.getPublicState() });
};

const quitGame = async (req, res) => {
  const gameId = req.session.gameId;
  const username = req.session.username;

  delete req.session.gameId;
  playerDisconnect(gameId, username);

  res.status(200).json({ message: 'Player quit the game' });
};

const playerDisconnect = (gameId, username) => {
  if (gameId == null || !username) return;

  const key = String(gameId);
  const game = games.get(key);
  if (!game || !game.hasPlayer(username)) return;

  cancelResolve(key);
  game.deletePlayer(username);

  if (game.players.length === 0) {
    games.delete(key);
    return;
  }

  broadcastToUsers(game.getPlayerNames(), {
    type: 'playerDisconnected',
    gameId: key,
    username,
    game: game.getPublicState(),
  });
};

const restartGame = async (req, res) => {
  const gameId = req.session.gameId;
  const username = req.session.username;

  if (!gameId) {
    return res.status(400).json({ error: 'Missing gameId in your session. Make sure you are in a game' });
  }

  const game = games.get(String(gameId));
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }

  const result = game.restartGame(username);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  if (result.restarted) cancelResolve(gameId);
  broadcastState(gameId, game, { reason: result.restarted ? 'gameRestarted' : 'askedToRestart' });

  res.status(200).json({ gameId: String(gameId), game: game.getPublicState(), gameRestarted: result.restarted });
};

const revealCard = async (req, res) => {
  const gameId = req.session.gameId;
  const username = req.session.username;

  if (!gameId) {
    return res.status(400).json({ error: 'Missing gameId in your session. Make sure you are in a game' });
  }

  const game = games.get(String(gameId));
  if (!game) {
    return res.status(404).json({ error: 'Game does not exist.' });
  }

  const result = game.revealCard(username, req.params.rowIndex, req.params.colIndex);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  broadcastState(gameId, game, { reason: 'cardRevealed' });
  if (result.isTurnComplete) scheduleResolve(gameId);

  return res.status(200).json({ gameId: String(gameId), game: game.getPublicState() });
};

const sweeper = setInterval(() => {
  const now = Date.now();
  for (const [gameId, game] of games) {
    if (game.players.length === 0 || now - game.updatedAt > GAME_TTL_MS) {
      cancelResolve(gameId);
      games.delete(gameId);
    }
  }
}, GAME_SWEEP_MS);
sweeper.unref();

module.exports = {
  createGame,
  joinGame,
  getGame,
  gameExist,
  getGameById,
  isUsernameInGame,
  quitGame,
  playerDisconnect,
  revealCard,
  restartGame,
};
