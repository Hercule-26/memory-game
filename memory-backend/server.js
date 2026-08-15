// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const crypto = require("crypto");
const http = require("http");

const app = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
  app.use((req, res, next) => {
    req.headers["x-forwarded-proto"] = "https";
    next();
  });
}

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
  : ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:8080"];
console.log("Allowed Origins:", allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("Blocked by CORS:", origin);
      callback(null, false);
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

if (isProduction && !process.env.SESSION_SECRET) {
  console.warn(
    "SESSION_SECRET is not set: a random one is generated, every restart will log all players out."
  );
}

const store = new session.MemoryStore();

const sessionParser = session({
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex"),
  resave: false,
  saveUninitialized: false,
  rolling: true,
  store,
  cookie: {
    maxAge: 1000 * 60 * 60 * 12,
    secure: isProduction,
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
  },
});

app.use(sessionParser);

const sessionSweeper = setInterval(() => {
  store.all(() => {});
}, 10 * 60 * 1000);
sessionSweeper.unref();

app.use(express.json({ limit: "10kb" }));

const authRoutes = require("./routes/authRoute");
app.use("/auth", authRoutes);

const gameRoutes = require("./routes/gameRoute");
const requireAuth = (req, res, next) => {
  if (req.session.authentificated && req.session.username) return next();
  return res.status(401).json({ error: "Not authenticated" });
};
app.use("/game", requireAuth, gameRoutes);

const { initWebSocket, closeAll } = require("./sockets/socket");
const server = http.createServer(app);
initWebSocket(server, sessionParser);

app.get("/", (req, res) => {
  res.send("API is running");
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ error: "Internal server error" });
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down.`);
  closeAll();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000).unref();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
