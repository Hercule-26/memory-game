
const Game = require("../model/Game");
const games = new Map();

const createGame = async (req, res) => {
  try {
    const playerId = req.body.playerId;
    const gameId = req.body.gameId;
    if (!playerId) {
      return res.status(400).json("Player Id is missing");
    } 
    if (!gameId) {
      return res.status(400).json("Game Id is missing");
    }
    if (games[gameId]) {
      return res.status(400).json(`Game with name '${gameId}' already exists`);
    }
    const game = new Game(gameId, playerId);
    games[gameId] = game;    
    res.status(201).json({ message: `Game '${gameId}' created` });
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
