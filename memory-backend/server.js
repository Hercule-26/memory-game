const express = require("express");
const cors = require("cors");
const session = require("express-session");
const store = new session.MemoryStore();
const http = require("http");

require("dotenv").config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  session({
    secret: process.env.SESSION_SECRET || "SessionSecret",
    resave: false,
    saveUninitialized: false,
    store,
    cookie: {
      maxAge: 30000,
      secure: false,
      httpOnly: true,
    },
  })
);

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(store);
  next();
});

const authRoutes = require("./routes/authRoute");
app.use("/auth", authRoutes);
const gameRoutes = require("./routes/gameRoute");
app.use("/game", gameRoutes);


// Creating a http server with express
const server = http.createServer(app);

// const WebSocket = require("ws");
// // Creation of a WebSocket linked to http server
// const wss = new WebSocket.Server({ server });

// wss.on("connection", (ws) => {
//   console.log("Client connected");

//   ws.on("message", (message) => {
//     const data = JSON.parse(message);
//     if (data.type === "createGame") {
//       ws.send(`Game '${data.gameName}' created successfully!`);
//     }
//   });
  
//   ws.on("close", () => {
//     console.log("Client disconnected");
//   });
// });

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