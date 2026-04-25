# Callbreak

Real-time multiplayer Callbreak game built as a TypeScript monorepo with:

- `apps/client`: React + Vite + Tailwind storefront for players
- `apps/server`: Express + Socket.IO game server
- `packages/shared`: shared game rules, types, constants, and event contracts

The app supports room-based multiplayer, bots, bidding, trick play, scoring, chat, rematch flow, and configurable room settings.

## Features

- Create and join private rooms with a 4-letter room code
- No signup required
- Real-time gameplay over Socket.IO
- Automatic bot fill for empty seats
- Manual bot seat assignment by host
- Host-controlled room settings
- Turn timer with automatic fallback actions on timeout
- Five-round Callbreak match flow
- Bidding and trick resolution
- Score tracking across rounds
- In-room chat with basic rate limiting
- Rematch after game end
- Shared TypeScript types between client and server
- Basic automated tests for core game engine behavior

## Tech Stack

- Monorepo: npm workspaces
- Frontend: React 18, Vite, TypeScript, Tailwind CSS, Zustand, Framer Motion, React Router
- Backend: Node.js, Express, Socket.IO, TypeScript
- Shared package: TypeScript domain models, rules, constants, socket event contracts
- Testing: Vitest

## Monorepo Structure

```text
callbreak/
├── apps/
│   ├── client/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── chat/
│   │   │   │   ├── end/
│   │   │   │   ├── lobby/
│   │   │   │   ├── table/
│   │   │   │   └── ui/
│   │   │   ├── lib/
│   │   │   ├── pages/
│   │   │   ├── socket/
│   │   │   ├── store/
│   │   │   ├── styles/
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── .env.example
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── server/
│       ├── src/
│       │   ├── game/
│       │   ├── lib/
│       │   ├── socket/
│       │   │   └── handlers/
│       │   ├── config.ts
│       │   └── index.ts
│       └── package.json
├── packages/
│   └── shared/
│       ├── src/
│       │   ├── events/
│       │   ├── rules/
│       │   ├── types/
│       │   ├── utils/
│       │   └── index.ts
│       └── package.json
├── .env.example
├── package.json
└── tsconfig.base.json
```

## How It Works

### Client

- Home screen lets players set a display name, create a room, or join an existing room.
- Room screen switches between lobby and game table based on room state.
- Zustand stores keep session and room state in sync with socket events.
- Tailwind-based UI renders lobby, hand, trick area, scoreboard, timer, chat, and end-game modal.

### UI Direction

- Browser-based, app-like, multiplayer-first experience
- Direct table-first flow with minimal friction between landing and gameplay
- Full-screen multiplayer room with the table as the primary surface
- Fixed player positions: top, left, right opponents and your hand at the bottom
- Strong real-time feedback: active turn glow, card animations, bid updates, trick win highlight
- Compact secondary controls for room code, chat, settings, and rules
- Faster room flow: enter name, create or join, move into the room immediately
- Mobile browser optimization so the game feels closer to a native multiplayer card app
- Game-first landing page similar to real browser Callbreak rooms rather than a generic website layout

### Server

- Express exposes `GET /health`.
- Socket.IO handles connection lifecycle, room actions, game actions, and chat.
- The game engine manages:
  - room lifecycle
  - bidding
  - legal move validation
  - trick winner calculation
  - round scoring
  - bot behavior
  - timeout auto-actions
  - rematch reset

### Shared Package

- exports domain types like `Room`, `Player`, `GameState`, `Card`
- exports room defaults and rule constants
- exports deck, trick, and scoring utilities
- exports typed client/server socket event contracts

## Gameplay Rules in This Project

- 4 players per room
- 13 cards per player
- Spades are trump
- 5 rounds per match
- Bid range: `1` to `8`
- Optional spade-breaking rule support
- Turn timeout is configurable per room
- If a player times out:
  - bidding phase: minimum bid is auto-submitted
  - playing phase: first legal card is auto-played

## Room Settings

Current configurable settings:

- `loserPenalty`: free-text penalty/forfeit note
- `turnTimeoutMs`: per-turn timer
- `fillWithBots`: auto-fill empty seats when the game starts
- `spadeBreakingEnabled`: enforce spade-breaking behavior

## Environment Variables

Root `.env` values are consumed by the server and local client config.

Create `.env` in the project root from `.env.example`:

```env
PORT=3001
CORS_ORIGIN=http://localhost:5173
TURN_TIMEOUT_MS=30000
ROOM_TTL_MS=7200000
LOG_LEVEL=info
VITE_SERVER_URL=http://localhost:3001
```

Client-specific example in `apps/client/.env.example`:

```env
VITE_SERVER_URL=http://localhost:3001
```

### Variable Notes

- `PORT`: HTTP and Socket.IO server port
- `CORS_ORIGIN`: allowed frontend origin
- `TURN_TIMEOUT_MS`: default turn timeout in milliseconds
- `ROOM_TTL_MS`: inactive room expiry time
- `LOG_LEVEL`: server logging level
- `VITE_SERVER_URL`: frontend socket/server base URL

## Getting Started

### Requirements

- Node.js 18+
- npm 9+

### Install

```bash
npm install
```

### Run In Development

Starts both client and server concurrently:

```bash
npm run dev
```

Default local URLs:

- Client: `http://localhost:5173`
- Server: `http://localhost:3001`
- Health check: `http://localhost:3001/health`

### Build

```bash
npm run build
```

### Test

```bash
npm run test
```

### Lint

```bash
npm run lint
```

## Workspace Scripts

Root scripts from `package.json`:

```json
{
  "dev": "concurrently \"npm run dev --workspace=apps/server\" \"npm run dev --workspace=apps/client\"",
  "build": "npm run build --workspace=packages/shared && npm run build --workspace=apps/server && npm run build --workspace=apps/client",
  "test": "npm run test --workspace=packages/shared --workspace=apps/server",
  "lint": "eslint . --ext .ts,.tsx"
}
```

App-level scripts:

- `apps/client`
  - `npm run dev --workspace=apps/client`
  - `npm run build --workspace=apps/client`
  - `npm run preview --workspace=apps/client`
- `apps/server`
  - `npm run dev --workspace=apps/server`
  - `npm run build --workspace=apps/server`
  - `npm run start --workspace=apps/server`
  - `npm run test --workspace=apps/server`
- `packages/shared`
  - `npm run build --workspace=packages/shared`
  - `npm run test --workspace=packages/shared`

## Key Files

- `package.json`: root workspace and scripts
- `apps/client/src/App.tsx`: client routing
- `apps/client/src/pages/Home.tsx`: room create/join flow
- `apps/client/src/pages/Room.tsx`: room state entry point
- `apps/server/src/index.ts`: Express and Socket.IO bootstrap
- `apps/server/src/config.ts`: environment config
- `apps/server/src/game/game-engine.ts`: game state machine
- `apps/server/src/game/room-manager.ts`: in-memory room storage and expiry
- `apps/server/src/socket/handlers/room.ts`: room socket actions
- `apps/server/src/socket/handlers/game.ts`: game socket actions
- `apps/server/src/socket/handlers/chat.ts`: chat handling
- `packages/shared/src/index.ts`: shared exports surface

## Networking

### HTTP

- `GET /health`

Returns:

```json
{ "ok": true }
```

### Socket Events

Main room events:

- `room:create`
- `room:join`
- `room:updateConfig`
- `room:kick`
- `room:addBot`
- `room:state`

Main game events:

- `game:start`
- `game:bid`
- `game:play`
- `game:rematch`

Main chat events:

- `chat:send`
- `chat:message`

## Current Architecture Notes

- Room state is stored in memory, not in a database.
- There is no authentication or persistence layer yet.
- Realtime communication is socket-first.
- Shared rules live in `packages/shared` to keep client/server behavior aligned.
- Room expiry runs on an interval and removes inactive rooms.

## Logic Approach

Current logic that already fits a browser multiplayer Callbreak game well:

- Socket.IO real-time multiplayer
- Room-based play
- Shared game rules package
- Server-authoritative turns and actions
- Bidding, trick play, and scoring flow
- Bot fill for empty seats
- Timeout handling
- Rematch flow

Main logic improvements to prioritize next:

- Reconnect and session recovery so refreshes and network drops do not break the match
- Room persistence beyond in-memory runtime
- Stronger start-game and seat validation
- Host transfer or better disconnect handling
- Anti-desync protections with the server remaining the full source of truth
- Rejoin or spectator support for interrupted games

## Current Limitations

- No database or permanent room history
- No user accounts or auth
- No reconnect persistence across server restarts
- No matchmaking or public lobby
- No production deployment config yet
- No CI/CD config yet
- Limited automated test coverage outside core game engine flow

## Roadmap Ideas

- persistent storage for rooms, match history, and player stats
- reconnection recovery and resume flow
- spectators and observers
- ranked or matchmaking modes
- richer bot difficulty levels
- deployment setup with reverse proxy and process manager
- analytics, monitoring, and structured logs

## Development Notes

- This is the current documented state of the repository.
- `AGENTS.md` mentions a broader e-commerce target, but the actual codebase in this repo is a Callbreak multiplayer game.
- If the project direction changes, update this README to match the implemented source of truth.
