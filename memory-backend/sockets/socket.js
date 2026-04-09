let wss = null;
const socketRegistry = new Map(); // key: username, value: WebSocket
const disconnectTimers = new Map(); // key: username, value: timeout ID

function initWebSocket(server) {
  const WebSocket = require("ws");
  wss = new WebSocket.Server({ server });

  console.log("WebSocket server initialized.");

  wss.on("connection", (ws) => {

    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message);

        if (data.type === "registerSocket" && data.username && data.gameId) {
          // Cancel disconnect timeout if exists
          if (disconnectTimers.has(data.username)) {
            clearTimeout(disconnectTimers.get(data.username));
            disconnectTimers.delete(data.username);
          }

          ws.gameId = data.gameId;
          ws.username = data.username;
          socketRegistry.set(data.username, { ws: ws });
        }
      } catch (err) {
        console.error("Error handling message:", err);
      }
    });

    ws.on("close", () => {
      socketRegistry.delete(ws.username);
      const timer = setTimeout(() => {
        disconnectTimers.delete(ws.username);
        removePlayerFromGame(ws.gameId, ws.username);
      }, 5000); // 5 sec

      disconnectTimers.set(ws.username, timer);    });
  });
}

function getSocketByUserId(username) {
  const socketEntry = socketRegistry.get(username);
  return socketEntry ? socketEntry.ws : null;
}

function userExist(username) {
  const exists = socketRegistry.has(username);
  return exists;
}

function removePlayerFromGame(gameId, username) {
  const { playerDisconnect } = require("../controllers/gameController");
  playerDisconnect(gameId, username);
}

module.exports = {
  initWebSocket,
  getSocketByUserId,
  userExist
};
