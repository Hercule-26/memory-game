const express = require("express");
const router = express.Router();
const {
  createGame,
  joinGame,
  quitGame,
  getGame,
  revealCard,
  restartGame,
} = require("../controllers/gameController");

router.post("/create", createGame);

router.post("/join/:id", joinGame);

router.post("/exit", quitGame);

router.post("/reveal/:rowIndex/:colIndex", revealCard);

router.post("/restart", restartGame);

router.get("/:id", getGame);

module.exports = router;
