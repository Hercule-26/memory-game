let wss = null;
const socketRegistry = new Map(); // key: username, value: WebSocket instance

function initWebSocket(server) {
  const WebSocket = require("ws");
  wss = new WebSocket.Server({ server });

  wss.on("connection", (ws) => {
    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === "registerSocket" && data.username) {
          socketRegistry.set(data.username, ws);
          console.log(`Client socket registered for ${data.username}`);
        } else if(data.type === "message") {
          console.log(data);
          ws.send('Test from server');
        }

      } catch (err) {
        console.error("Error handling message:", err);
      }
    });

    ws.on("close", () => {
      for (const [username, socket] of socketRegistry) {
        if (socket === ws) {
          socketRegistry.delete(username);
          console.log(`Socket for ${username} removed`);
          break;
        }
      }
    });
  });
}

function getSocketByUsername(username) {
  return socketRegistry.get(username);
}

function userExist(username) {
  return socketRegistry.get(username) !== undefined;
}

module.exports = {
  initWebSocket,
  getSocketByUsername,
  userExist
};
