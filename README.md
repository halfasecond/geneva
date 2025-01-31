# The Paddock 🐎

A real-time multiplayer horse paddock built with Vite, React, and TypeScript. Horses can move freely in a shared space, with synchronized movement and viewport management.

## Features

- 🎮 Real-time multiplayer movement
- 🎯 Smooth local movement with WASD/arrow keys
- 🎥 Dynamic viewport management with edge detection
- 🗺️ Minimap for navigation
- 🔄 Automatic direction flipping based on movement
- 🌐 WebSocket-based synchronization
- 🎨 SVG horse animations

## Architecture

### Vite Plugin Game Server

The project uses a unique approach by implementing the game server as a Vite plugin. This allows:
- Development server and game server to run together
- Hot module reloading while maintaining socket connections
- Simplified development workflow

### React Hooks

The game logic is organized into custom React hooks:

#### useGameServer
- Manages WebSocket connection
- Handles player state synchronization
- Broadcasts movement to other players
- Filters local vs remote updates

#### useMovement
- Handles keyboard input
- Updates local position
- Manages viewport offset
- Implements edge detection
- Provides smooth movement

#### useZoom
- Controls camera zoom level
- Manages zoom origin point
- Handles viewport scaling
- Keyboard shortcuts (Ctrl +/-)

### Styled Components

The UI is built with styled-components, featuring:
- Responsive layout
- Hardware-accelerated transforms
- Efficient updates using will-change
- Dynamic scaling and positioning

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn

### Installation

```bash
# Clone the repository
git clone [repository-url]

# Install dependencies
yarn install

# Start development server
yarn dev
```

The game will be available at `http://localhost:3131`

### Controls

- Movement: WASD or Arrow keys
- Zoom: Ctrl + / Ctrl -
- Direction: Automatically flips based on movement

## Development

### Project Structure

```
src/
  ├── components/
  │   └── Paddock/
  │       ├── hooks/
  │       │   ├── useGameServer.ts   # Socket management
  │       │   ├── useMovement.ts     # Movement controls
  │       │   └── useZoom.ts         # Camera controls
  │       ├── Paddock.tsx            # Main component
  │       └── Paddock.style.ts       # Styled components
  └── server/
      ├── socket.ts                  # WebSocket handler
      └── vite-plugin-game-server.ts # Vite integration
```

### Key Concepts

1. **Local-First Updates**
   - Movement updates are applied locally first
   - Then broadcast to other players
   - Results in smooth local experience

2. **Viewport Management**
   - Horse stays within 90% safe area
   - Viewport moves when approaching edges
   - Smooth transitions between areas

3. **State Management**
   - Local position state in useMovement
   - Other players' state in useGameServer
   - Minimap reflects all positions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Horse SVG assets from [source]
- Inspired by multiplayer game architecture patterns
- Built during an AI Agent Hackathon
