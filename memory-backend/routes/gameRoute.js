const express = require("express");
const router = express.Router();
const { createGame, joinGame, quitGame , getGame } = require("../controllers/gameController")

router.post("/create", createGame);

router.get("/join/:id", joinGame);

router.get("/:id", getGame);

router.get("/exit/:gameId/:playerId", quitGame);

module.exports = router;
