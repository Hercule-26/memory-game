const express = require("express");
const router = express.Router();
const { createGame, joinGame, quitGame , getGame, revealCard, checkCardsMatch } = require("../controllers/gameController")

router.post("/create", createGame);

router.get("/join/:id", joinGame);

router.get("/exit/:gameId/:playerId", quitGame);

router.get("/reveal/:rowIndex/:colIndex", revealCard);

router.get("/match", checkCardsMatch);

router.get("/:id", getGame);

module.exports = router;
