const express = require("express");
const router = express.Router();

router.post("/login", async (req, res) => {
    const username = req.body.username;
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
    res.json({ username: req.session.username });
  } else {
    res.status(401).json({ error: "Non authentifié" });
  }
});

router.post("/logout", async (req, res) => {
    req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: "Erreur lors de la déconnexion" });
    }
    res.clearCookie('connect.sid');
    res.status(200).json({ message: "Déconnecté avec succès" });
  });
});

module.exports = router;
