# Multiplayer Memory Game

A real-time, two-player memory card game. Create a lobby, share the 6-digit code, and race your
opponent to find the most pairs.

Vue 3 + Vite + Pinia on the front, Node.js + Express + `ws` on the back, REST for the actions and
WebSocket for the live updates.

## Features

- Real-time two-player games over WebSocket
- Simple lobbies: create a game, share the 6-digit ID
- Turn-based rules: match and you keep playing, miss and the turn passes
- Live scores and active player, always in sync on both screens
- Automatic reconnection: a refresh or a short network drop does not end your game
- Server-authoritative state: every rule is enforced server-side and face-down cards never leave the server
- Dockerized, with Traefik labels included

## How it works

The client never decides anything: it sends an intent (`reveal this card`), the server validates it,
updates the state and broadcasts it to both players. When two cards are face up, a timer **on the
server** compares them and pushes the result. That way a player who refreshes or loses their
connection mid-turn cannot leave the board stuck.

## Project structure

```
.
├── docker-compose.yaml
├── memory-backend/            # Node.js + Express + ws
│   ├── controllers/           # Game orchestration, broadcasts, turn resolution
│   ├── model/                 # Game, Player, Card (all the rules)
│   ├── routes/                # /auth and /game endpoints
│   ├── sockets/               # WebSocket registry, heartbeat, disconnections
│   └── server.js              # App wiring, sessions, CORS, error handling
└── memory-frontend/           # Vue 3 + Vite + Pinia + Tailwind
    ├── nginx.conf             # SPA fallback + asset caching for the image
    └── src/                   # components, views, stores, router
```

## Getting started

Requires Node.js 20+ and npm, or Docker.

### With Docker

Create a `.env` file at the root:

```bash
SERVER_SECRET=change_me

BACKEND_URL=localhost:3000
PROJECT_TAG=memory      # optional if you are not using Traefik
DOMAIN_URL=localhost    # optional if you are not using Traefik

FRONTEND_PORT=8080
BACKEND_PORT=3000
```

If you use Traefik, create the network first with `docker network create traefik-network`.
Otherwise comment out the `networks` and `labels` sections in `docker-compose.yaml`.

```sh
docker compose up --build
```

Frontend on `http://localhost:8080`, API on `http://localhost:3000`.

### Locally

```sh
cd memory-backend  && cp .env.example .env && npm install && npm run dev   # port 3000
cd memory-frontend && cp .env.example .env && npm install && npm run dev   # port 5173
```

To play against yourself, open the second client in a private window: each player needs their own
session cookie.

Frontend scripts: `npm run dev`, `npm run build`, `npm run type-check`, `npm run lint`.

## Configuration

**Root `.env`** (used by `docker-compose.yaml`): `SERVER_SECRET`, `BACKEND_URL`, `DOMAIN_URL`,
`PROJECT_TAG`, `FRONTEND_PORT`, `BACKEND_PORT`.

**`memory-frontend/.env`**: `VITE_API_URL` and `VITE_SOCKET_URL` (`ws://` or `wss://`).

**`memory-backend/.env`**

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port the Express server listens on |
| `SESSION_SECRET` | random | Secret used to sign session IDs |
| `ALLOWED_ORIGINS` | localhost origins | Comma-separated CORS allow-list |
| `NODE_ENV` | `development` | `production` enables secure cross-site cookies |
| `FLIP_BACK_MS` | `1500` | How long both cards stay face up before being compared |
| `DISCONNECT_GRACE_MS` | `10000` | Grace period before a disconnected player is removed |
| `GAME_TTL_MS` | `7200000` | Idle time after which an abandoned game is collected |

In production the API and the frontend are served from different hosts, so the session cookie is
issued with `SameSite=None; Secure`: both must be served over HTTPS.

## API

All `/game` routes require an authenticated session. Errors always answer with `{ "error": "..." }`.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/login` | Claims a username (`{ username }`) and opens a session |
| `GET` | `/auth/profile` | Current username and game, or `{ username: null }` |
| `POST` | `/auth/logout` | Leaves the current game and destroys the session |
| `POST` | `/game/create` | Creates a game (`{ gameName }`), returns the 6-digit `gameId` |
| `POST` | `/game/join/:id` | Joins an existing game |
| `GET` | `/game/:id` | Current state of a game you belong to |
| `POST` | `/game/reveal/:row/:col` | Turns a card face up |
| `POST` | `/game/restart` | Votes to restart; both players must agree |
| `POST` | `/game/exit` | Leaves the game |
| `GET` | `/health` | Liveness probe |

Game responses share the same shape: `{ gameId, game }`, where `game` holds `partyName`, `players`,
`board`, `currentPlayerIndex`, `matchedPairs`, `totalPairs`, `nbCardRevealed`, `askedToRestart`,
`gameIsOver` and `isFull`. Hidden cards are serialized as `{ value: null, isRevealed, isMatched }`.

## WebSocket

The handshake reuses the HTTP session cookie; an unauthenticated connection is rejected with `401`.
Once connected the client registers with
`{ "type": "registerSocket", "username": "alice", "gameId": "482913" }`, then receives:

- `gameState` — `{ gameId, game, reason? }`, the authoritative state after every change
- `playerDisconnected` — `{ gameId, username, game }`, the opponent left or timed out
- `error` — `{ code, error }`, either `GAME_NOT_FOUND` or `FORBIDDEN`

The server pings every 30 seconds and drops sockets that stop answering. On the client, a lost
connection triggers a reconnection with exponential backoff and resyncs the game on registration.

## Design notes

- **Server-authoritative.** Turn order, card bounds, already-revealed cards and end-of-game are
  validated in `model/Game.js`. The client checks only save a round trip.
- **No peeking.** The API only exposes the value of a card that is face up, so the board cannot be
  read from the network tab.
- **Fair shuffle.** Fisher-Yates, not `sort(() => Math.random() - 0.5)`, which is not uniform.
- **Session-scoped actions.** Quitting, revealing and restarting act on the game stored in your own
  session, so nobody can act on a game they did not join.
- **Bounded memory.** Games live in memory; abandoned games and expired sessions are collected
  periodically. Restarting the server clears every running game, a deliberate trade-off for a small
  stateless deployment.
