# 🎮 Multiplayer UNO Game

A real-time multiplayer UNO card game built with **Express**, **Socket.io**, and **TypeScript**.

## Features

- ✅ Real-time multiplayer gameplay (2-4 players)
- ✅ Full UNO rules implementation
- ✅ Room-based game system
- ✅ All card types: Number cards, Skip, Reverse, Draw Two, Wild, Wild Draw Four
- ✅ UNO calling mechanic
- ✅ Beautiful, responsive UI
- ✅ Player disconnect handling
- ✅ **Player reconnection** - rejoin ongoing games with same room + name

## Game Rules

### Card Types
- **Number Cards (0-9)**: Match color or number
- **Skip**: Skip the next player's turn
- **Reverse**: Reverse the direction of play
- **Draw Two**: Next player draws 2 cards and loses their turn
- **Wild**: Choose any color to continue play
- **Wild Draw Four**: Choose any color, next player draws 4 cards and loses their turn

### How to Play
1. Match the top card by **color** or **number**
2. Wild cards can be played anytime
3. If you can't play, draw a card
4. Call "UNO" when you have one card left
5. First player to empty their hand wins!

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Setup

1. Install dependencies:
```bash
npm install
```

2. **(Optional)** Configure environment variables:
```bash
# Copy the template to create your .env file
cp ENV_TEMPLATE.md .env
# Or create a .env file manually - see Configuration section below
```

3. Build the TypeScript code:
```bash
npm run build
```

4. Start the server:
```bash
npm start
```

Or for development with auto-reload (recommended):
```bash
npm run dev
```

5. Open your browser and navigate to:
```
http://localhost:3000
```

## Configuration

The application can be configured using environment variables. Create a `.env` file in the project root or set environment variables directly.

### Quick Start

The server will work with default values if no `.env` file is present. For custom configuration:

```bash
# Create .env file from template
cp ENV_TEMPLATE.md .env

# Edit the values
nano .env
```

### Available Configuration Options

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `PORT` | Server port | `3000` | `8080` |
| `NODE_ENV` | Environment mode | `development` | `production` |
| `HOST` | Host address | `0.0.0.0` | `localhost` |
| `CORS_ORIGIN` | Allowed CORS origins | `*` | `https://yourgame.com` |
| `MAX_ROOMS` | Maximum game rooms | `100` | `500` |
| `MAX_PLAYERS_PER_ROOM` | Max players per room | `4` | `6` |
| `ROOM_CLEANUP_INTERVAL` | Cleanup interval (ms) | `300000` (5 min) | `600000` |
| `LOG_LEVEL` | Logging level | `debug` | `info` |
| `SESSION_SECRET` | Session encryption key | `dev-secret...` | (generate secure key) |

### Environment Examples

**Development:**
```bash
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug
```

**Production:**
```bash
PORT=8080
NODE_ENV=production
CORS_ORIGIN=https://yourgame.com
MAX_ROOMS=500
LOG_LEVEL=info
SESSION_SECRET=<your-secure-secret>
```

**⚠️ Important for Production:**
- Always set a custom `SESSION_SECRET`
- Configure `CORS_ORIGIN` to your domain
- Set `NODE_ENV=production`

Generate a secure session secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

For more details, see [ENV_TEMPLATE.md](ENV_TEMPLATE.md).

### Development

- **Build once**: `npm run build` - Compiles TypeScript to JavaScript
- **Watch mode**: `npm run watch` - Automatically recompile on file changes
- **Dev mode**: `npm run dev` - Run with auto-reload using ts-node-dev

## How to Play

### Starting a Game

1. **Enter Your Name**: Type your player name
2. **Enter Room ID**: Choose a room name (e.g., "room123")
3. **Join Room**: Click "Join Room" button
4. **Wait for Players**: Wait for 2-4 players to join
5. **Start Game**: Any player can click "Start Game" once at least 2 players have joined

### Playing the Game

- **Your Turn**: Cards you can play will be highlighted in gold
- **Play a Card**: Click on a playable card to play it
- **Wild Cards**: When playing a Wild or Wild +4, choose a color from the popup
- **Draw Card**: Click the deck if you can't play or want to draw
- **Call UNO**: Click the "UNO!" button when you have one card left

### Multiplayer

Multiple players can join the same room by using the same Room ID. Each room supports 2-4 players.

### Reconnection

If you get disconnected during a game, you can reconnect by:
1. Rejoining the **same Room ID**
2. Using the **same Player Name** you used initially

Your cards and game position will be preserved, and you'll rejoin right where you left off! Other players will see you as "(Disconnected)" until you reconnect.

See [RECONNECTION_FEATURE.md](RECONNECTION_FEATURE.md) for detailed information about the reconnection feature.

## Project Structure

```
.
├── src/
│   ├── server.ts      # Express + Socket.io server
│   ├── game.ts        # UNO game logic with full type safety
│   └── types.ts       # TypeScript type definitions
├── public/
│   ├── index.html     # Game interface
│   ├── styles.css     # Styling
│   └── client.js      # Client-side logic
├── dist/              # Compiled JavaScript (generated)
├── tsconfig.json      # TypeScript configuration
└── package.json       # Dependencies
```

## Socket.io Events

### Client → Server
- `joinRoom`: Join or create a game room
- `startGame`: Start the game
- `drawCard`: Draw a card from the deck
- `playCard`: Play a card from your hand
- `callUno`: Call UNO when you have 1 card
- `getRooms`: Get list of active rooms

### Server → Client
- `gameState`: Updated game state
- `yourHand`: Your current hand of cards
- `gameStarted`: Game has begun
- `cardPlayed`: A card was played
- `playerJoined`: Player joined the room
- `playerLeft`: Player left the room
- `unoCalled`: Player called UNO
- `gameOver`: Game finished with winner
- `error`: Error message

## Configuration

You can change the server port by setting the `PORT` environment variable:

```bash
PORT=8080 npm start
```

## Technologies Used

- **Backend**: Node.js, Express.js, TypeScript
- **Real-time Communication**: Socket.io
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Game Logic**: Custom UNO implementation with full type safety
- **Type System**: TypeScript with strict mode enabled

## Future Enhancements

Potential features to add:
- [ ] AI players
- [ ] Score tracking across multiple rounds
- [ ] Player authentication
- [ ] Chat system
- [ ] Sound effects
- [ ] Animations for card plays
- [ ] Mobile app version
- [ ] Tournament mode

## License

MIT

## Credits

Created as a demonstration of multiplayer browser game development with Socket.io.

Enjoy playing! 🎉

