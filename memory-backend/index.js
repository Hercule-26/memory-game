const express = require("express");
const cors = require("cors");
require("dotenv").config();

const gameRoutes = require("./routes/game");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use("/api/game", gameRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
