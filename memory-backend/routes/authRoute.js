const express = require("express");
const router = express.Router();
const { userExist } = require("../sockets/socket");

router.post("/login", async (req, res) => {
    const username = req.body.username;
    if(userExist(username)) {
      res.status(400).json("User already exist");
    }
    if(username) {
        if(req.session.authentificated) {
            res.status(200).json({ username: req.session.username });
        } else {
            req.session.authentificated = true;
            req.session.username = username;
            res.status(200).json({ username: req.session.username });
        }
    } else {
        res.status(400).json("Bad Credentials")
    }
});

router.get("/profile", (req, res) => {
  if (req.session.authentificated) {
    if(req.session.game) {
      res.json({ 
        username: req.session.username,
        game: req.session.game,
      });  
    } else {
      res.json({ username: req.session.username });
    }
  } else {
    res.status(401).json({ error: "Not authentificated" });
  }
});

router.post("/logout", async (req, res) => {
    req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: "Error while disconnecting" });
    }
    res.clearCookie('connect.sid');
    res.status(200).json({ message: "Disconnected succesfully" });
  });
});

module.exports = router;