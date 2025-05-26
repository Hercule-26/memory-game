const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { connectToDB } = require("./repository/db");
const gameRoutes = require("./routes/game");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use("/api/game", gameRoutes);

connectToDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error("Server not started due to DB connection failure.");
    process.exit(1);
  });