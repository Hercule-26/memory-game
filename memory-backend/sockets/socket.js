let wss = null;
const socketRegistry = new Map(); // key: username, value: WebSocket
const disconnectTimers = new Map(); // key: username, value: timeout ID

function initWebSocket(server) {
  const WebSocket = require("ws");
  wss = new WebSocket.Server({ server });

  console.log("WebSocket server initialized.");

  wss.on("connection", (ws) => {
    console.log("New client connected.");

    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message);

        if (data.type === "registerSocket" && data.username && data.gameId) {
          console.log(`Registering socket for user: ${data.username} in game: ${data.gameId}`);

          // Cancel disconnect timeout if exists
          if (disconnectTimers.has(data.username)) {
            clearTimeout(disconnectTimers.get(data.username));
            disconnectTimers.delete(data.username);
            console.log(`Cleared disconnect timer for user: ${data.username}`);
          }

          ws.gameId = data.gameId;
          ws.username = data.username;
          socketRegistry.set(data.username, { ws: ws });

          console.log(`User ${data.username} registered and added to socketRegistry.`);
        }
      } catch (err) {
        console.error("Error handling message:", err);
      }
    });

    ws.on("close", () => {
      console.log(`Connection closed for user: ${ws.username}`);

      socketRegistry.delete(ws.username);
      console.log(`User ${ws.username} removed from socketRegistry.`);

      const timer = setTimeout(() => {
        disconnectTimers.delete(ws.username);
        removePlayerFromGame(ws.gameId, ws.username);
        console.log(`Timeout expired. User ${ws.username} from game ${ws.gameId} has been removed\n`);
      }, 5000); // 5 sec

      disconnectTimers.set(ws.username, timer);
      console.log(`Disconnect timer set for user: ${ws.username}`);
    });
  });
}

function getSocketByUserId(username) {
  const socketEntry = socketRegistry.get(username);
  return socketEntry ? socketEntry.ws : null;
}

function userExist(username) {
  const exists = socketRegistry.has(username);
  console.log(`userExist called for: ${username}. Exists: ${exists}`);
  return exists;
}

function removePlayerFromGame(gameId, username) {
  console.log(`Removing player ${username} from game ${gameId}`);
  const { playerDisconnect } = require("../controllers/gameController");
  playerDisconnect(gameId, username);
}

module.exports = {
  initWebSocket,
  getSocketByUserId,
  userExist
};
