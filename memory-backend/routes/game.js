const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
  res.json("Get Request !");
});

router.post("/", async (req, res) => {
  res.status(200).json("Post Request !");
});

module.exports = router;
