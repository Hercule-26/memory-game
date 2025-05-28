const express = require("express");
const router = express.Router();
const { createGame, joinGame, getGame } = require("../controllers/gameController")

router.post("/create", createGame);

router.get("/join/:id", joinGame);

router.get("/:id", getGame);

module.exports = router;
