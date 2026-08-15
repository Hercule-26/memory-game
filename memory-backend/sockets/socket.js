const WebSocket = require('ws');

let wss = null;
const socketRegistry = new Map(); // key: username, value: WebSocket
const disconnectTimers = new Map(); // key: username, value: { timer, gameId }

const DISCONNECT_GRACE_MS = Number(process.env.DISCONNECT_GRACE_MS || 10000);
const HEARTBEAT_MS = 30000;
const MAX_MESSAGE_LENGTH = 4096;

function initWebSocket(server, sessionParser) {
  wss = new WebSocket.Server({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    const accept = () => {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    };
    const reject = () => {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
    };

    if (typeof sessionParser !== 'function') return accept();

    try {
      sessionParser(req, {}, () => {
        if (!req.session || !req.session.authentificated) return reject();
        accept();
      });
    } catch (err) {
      console.error('Error while parsing the session during upgrade:', err);
      reject();
    }
  });

  wss.on('connection', (ws, req) => {
    ws.isAlive = true;
    ws.sessionUsername = req && req.session ? req.session.username : undefined;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (message) => {
      try {
        if (message.length > MAX_MESSAGE_LENGTH) return;
        const data = JSON.parse(message);
        if (!data || data.type !== 'registerSocket') return;

        const username = typeof data.username === 'string' ? data.username : null;
        const gameId = data.gameId != null ? String(data.gameId) : null;
        if (!username || !gameId) return;

        if (ws.sessionUsername && ws.sessionUsername !== username) {
          send(ws, { type: 'error', code: 'FORBIDDEN', error: 'Session does not match this username' });
          return;
        }

        const { getGameById } = require('../controllers/gameController');
        const game = getGameById(gameId);
        if (!game || !game.hasPlayer(username)) {
          send(ws, { type: 'error', code: 'GAME_NOT_FOUND', error: 'Game not found' });
          return;
        }

        cancelDisconnectTimer(username);

        const previous = socketRegistry.get(username);
        if (previous && previous !== ws && previous.readyState === WebSocket.OPEN) {
          previous.isReplaced = true;
          previous.close();
        }

        ws.gameId = gameId;
        ws.username = username;
        socketRegistry.set(username, ws);

        send(ws, { type: 'gameState', gameId, game: game.getPublicState() });
      } catch (err) {
        console.error('Error handling message:', err);
      }
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err.message);
    });

    ws.on('close', () => {
      const { username, gameId } = ws;
      if (!username || !gameId) return;

      if (socketRegistry.get(username) === ws) {
        socketRegistry.delete(username);
      }
      if (ws.isReplaced) return;

      cancelDisconnectTimer(username);
      const timer = setTimeout(() => {
        disconnectTimers.delete(username);
        try {
          const { playerDisconnect } = require('../controllers/gameController');
          playerDisconnect(gameId, username);
        } catch (err) {
          console.error('Error while removing a disconnected player:', err);
        }
      }, DISCONNECT_GRACE_MS);

      disconnectTimers.set(username, { timer, gameId });
    });
  });

  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      try {
        ws.ping();
      } catch (err) {
        ws.terminate();
      }
    });
  }, HEARTBEAT_MS);
  heartbeat.unref();

  wss.on('close', () => clearInterval(heartbeat));

  console.log('WebSocket server initialized.');
  return wss;
}

function cancelDisconnectTimer(username) {
  const pending = disconnectTimers.get(username);
  if (pending) {
    clearTimeout(pending.timer);
    disconnectTimers.delete(username);
  }
}

function send(ws, payload) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return false;
  try {
    ws.send(JSON.stringify(payload));
    return true;
  } catch (err) {
    console.error('Error while sending a socket message:', err.message);
    return false;
  }
}

function getSocketByUserId(username) {
  return socketRegistry.get(username) || null;
}

function sendToUser(username, payload) {
  return send(socketRegistry.get(username), payload);
}

function broadcastToUsers(usernames, payload) {
  if (!Array.isArray(usernames)) return;
  for (const username of usernames) {
    sendToUser(username, payload);
  }
}

function userExist(username) {
  return socketRegistry.has(username);
}

function closeAll() {
  for (const { timer } of disconnectTimers.values()) clearTimeout(timer);
  disconnectTimers.clear();
  socketRegistry.clear();
  if (wss) wss.close();
}

module.exports = {
  initWebSocket,
  getSocketByUserId,
  sendToUser,
  broadcastToUsers,
  userExist,
  closeAll,
};
