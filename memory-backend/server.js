// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const crypto = require("crypto");
const http = require("http");

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  console.log("Protocol:", req.protocol);
  console.log("X-Forwarded-Proto:", req.headers["x-forwarded-proto"]);
  console.log("Secure:", req.secure);
  next();
});

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? [ ...process.env.ALLOWED_ORIGINS.split(","), "localhost" ]
  : ["localhost"];
console.log("Allowed Origins:", allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

const store = new session.MemoryStore();

app.use(
  session({
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex"),
    resave: false,
    saveUninitialized: false,
    store,
    cookie: {
      maxAge: 1000 * 60 * 5,
      secure: false,
      httpOnly: true,
      sameSite: "none",
    },
  })
);

app.use(express.json());

const authRoutes = require("./routes/authRoute");
app.use("/auth", authRoutes);

const gameRoutes = require("./routes/gameRoute");
const requireAuth = (req, res, next) => {
  if (req.session.authentificated) next();
  else return res.status(401).json({ error: "Not authenticated" });
};
app.use("/game", requireAuth, gameRoutes);

const { initWebSocket } = require("./sockets/socket");
const { log } = require("console");
const server = http.createServer(app);
initWebSocket(server);

app.get("/", (req, res) => {
  res.send("API is running");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
