const express = require("express");
const cors = require("cors");
const session = require("express-session");
const store = new session.MemoryStore();
const http = require("http");

require("dotenv").config();
const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : [`http://localhost:${PORT}`];
console.log(allowedOrigins);

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
};
app.use(cors(corsOptions));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "SessionSecret",
    resave: false,
    saveUninitialized: false,
    store,
    cookie: {
      maxAge: 1000 * 60 * 60, // 1 hour,
      secure: false,
      httpOnly: true,
    },
  })
);

app.use(express.json());

const authRoutes = require("./routes/authRoute");
app.use("/auth", authRoutes);

const gameRoutes = require("./routes/gameRoute");
const requireAuth = (req, res, next) => {
  if(req.session.authentificated) {
    next();
  } else {
    return res.status(400).json("Not authentificated");
  }
};
app.use("/game", requireAuth, gameRoutes);

// Creating a http server with express
const server = http.createServer(app);

const { initWebSocket } = require("./sockets/socket");
const { log } = require("console");
initWebSocket(server);

// Listen with http
server.listen(PORT, '0.0.0.0', () => {
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