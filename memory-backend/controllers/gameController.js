
const Game = require("../model/Game");
const games = new Map();

const createGame = async (req, res) => {
  try {
    const playerUsername = req.session.username;
    const gameId = req.body.gameId;
    if (!gameId) {
      return res.status(400).json("Game Id is missing");
    }
    if (games[gameId]) {
      return res.status(400).json(`Game with name '${gameId}' already exists`);
    }
    const game = new Game(gameId, playerUsername);
    games[gameId] = game;
    req.session.game = game; 
    res.status(201).json({
      message: `Game '${gameId}' created`,
      game: game,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Error while creating the game" });
  }
};

const joinGame = async (req, res) => {
  res.status(200).json("Joining Game ...");
};

module.exports = {
    createGame, 
    joinGame
};
