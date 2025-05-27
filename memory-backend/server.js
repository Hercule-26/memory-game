const express = require("express");
const cors = require("cors");
const http = require("http");

require("dotenv").config();

const gameRoutes = require("./routes/gameRoute");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/game", gameRoutes);

// Creating a http server with express
const server = http.createServer(app);

const WebSocket = require("ws");

// Creation of a WebSocket linked to http server
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (message) => {
    const data = JSON.parse(message);
    if (data.type === "createGame") {
      ws.send(`Game '${data.gameName}' created successfully!`);
    }
  });
  
  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

// Listen with http
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// const { connectToDB } = require("./repository/db");
// connectToDB()
//   .then(() => {
//     app.listen(PORT, () => {
//       console.log(`Server running at http://localhost:${PORT}`);
//     });
//   })
//   .catch(err => {
//     console.error("Server not started due to DB connection failure.");
//     process.exit(1);
//   });