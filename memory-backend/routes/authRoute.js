const express = require("express");
const router = express.Router();
const { userExist } = require("../sockets/socket");
const { isUsernameInGame, gameExist } = require("../controllers/gameController");

const MAX_USERNAME_LENGTH = 20;
const USERNAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} _.-]*$/u;

function isUsernameTaken(username) {
  return userExist(username) || isUsernameInGame(username);
}

router.post("/login", (req, res) => {
  const username = typeof req.body.username === "string" ? req.body.username.trim() : "";

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }
  if (username.length > MAX_USERNAME_LENGTH) {
    return res.status(400).json({ error: `Username must be at most ${MAX_USERNAME_LENGTH} characters` });
  }
  if (!USERNAME_PATTERN.test(username)) {
    return res.status(400).json({ error: "Username contains invalid characters" });
  }

  if (req.session.authentificated && req.session.username === username) {
    return res.status(200).json({ username });
  }
  if (isUsernameTaken(username)) {
    return res.status(409).json({ error: "This username is already taken" });
  }

  req.session.regenerate((err) => {
    if (err) {
      console.error("Error while regenerating the session:", err);
      return res.status(500).json({ error: "Error while connecting" });
    }
    req.session.authentificated = true;
    req.session.username = username;
    req.session.save((saveErr) => {
      if (saveErr) {
        console.error("Error while saving the session:", saveErr);
        return res.status(500).json({ error: "Error while connecting" });
      }
      res.status(200).json({ username });
    });
  });
});

router.get("/profile", (req, res) => {
  if (!req.session.authentificated) {
    return res.status(200).json({ username: null });
  }

  if (req.session.gameId && !gameExist(req.session.gameId)) {
    delete req.session.gameId;
  }

  res.json({
    username: req.session.username,
    gameId: req.session.gameId || null,
  });
});

router.post("/logout", (req, res) => {
  const { gameId, username } = req.session;
  if (gameId && username) {
    const { playerDisconnect } = require("../controllers/gameController");
    playerDisconnect(gameId, username);
  }

  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Error while disconnecting" });
    }
    res.clearCookie("connect.sid");
    res.status(200).json({ message: "Disconnected succesfully" });
  });
});

module.exports = router;
