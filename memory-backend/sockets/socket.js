
let wss = null;
const socketRegistry = new Map(); // key: username, value: WebSocket
const disconnectTimers = new Map(); // key: username, value: timeout ID


function initWebSocket(server) {
  const WebSocket = require("ws");
  wss = new WebSocket.Server({ server });

  wss.on("connection", (ws) => {
    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message);
        if (data.type === "registerSocket" && data.username && data.gameId) {
          if (disconnectTimers.has(data.username)) {
            clearTimeout(disconnectTimers.get(data.username));
            disconnectTimers.delete(data.username);
            console.log(`Reconnection of ${data.username} within grace period`);
          }
          
          socketRegistry.set(data.username, { gameId: data.gameId, ws: ws});
          console.log(`Client socket for ${data.username} registered`);
        }
      } catch (err) {
        console.error("Error handling message:", err);
      }
    });

    ws.on("close", () => {
      for (const [username, socket] of socketRegistry) {
        if (socket.ws === ws) {
          console.log(`${username} disconnected. Waiting 30 seconds before removal.`);
          
          socketRegistry.delete(username);
          const timer = setTimeout(() => {
            disconnectTimers.delete(username);
            console.log(`Socket for ${username} removed after grace period`);
            removePlayerFromGame(socket.gameId, username);
          }, 5000); // 30 sec
          
          disconnectTimers.set(username, timer);
          break;
        }
      }
    });
  });
}

function getSocketByUserId(username) {
  const socketEntry = socketRegistry.get(username);
  return socketEntry ? socketEntry.ws : null;
}

function userExist(username) {
  return socketRegistry.has(username);
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
