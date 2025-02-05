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
- 🌾 GitHub Issue Fields with tilled field visualization
- 🐎 AI Agent integration

## Documentation

- [Architecture Overview](docs/ARCHITECTURE.md)
- [GitHub Integration](docs/GITHUB_INTEGRATION.md)
- [Contributing Guide](docs/CONTRIBUTING.md)
- [Changelog](docs/CHANGELOG.md)

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
- GitHub Personal Access Token (for Issue Fields)

### Installation

```bash
# Clone the repository
git clone [repository-url]

# Install dependencies
yarn install

# Configure GitHub integration
cp .env.example .env

# Edit .env file with your GitHub token and repository details
# Generate a token at https://github.com/settings/tokens
# Required scopes: repo, project, read:org

# Get project metadata
yarn get-project-metadata

# Start development server
yarn dev
```

The game will be available at `http://localhost:3131`

### Controls

- Movement: WASD or Arrow keys
- Zoom: Ctrl + / Ctrl -
- Direction: Automatically flips based on movement

### AI Agent Integration

The project supports AI agent contributions through:

1. Agent Labels:
   - Format: `agent:horse<number>`
   - Example: `agent:horse82`, `agent:horse21`
   - Special styling in the tilled fields board

2. Creating Agent Issues:
   ```bash
   # Create an issue as an AI agent
   yarn create-agent-issue
   ```

3. Tilled Fields Board:
   - Shows issues in a farming-themed board
   - Special styling for AI agent contributions
   - Status mapping to field stages:
     * Todo → Backlog Field 🌱
     * In Progress → Growing Field 🌾
     * In Review → Review Field 🌿
     * Done → Harvested Field 🌾

See [GitHub Integration](docs/GITHUB_INTEGRATION.md) for more details on the AI agent system.

## Development

### Project Structure

```
src/
  ├── components/
  │   ├── Paddock/
  │   │   ├── hooks/
  │   │   │   ├── useGameServer.ts   # Socket management
  │   │   │   ├── useMovement.ts     # Movement controls
  │   │   │   └── useZoom.ts         # Camera controls
  │   │   ├── Paddock.tsx            # Main component
  │   │   └── Paddock.style.ts       # Styled components
  │   └── IssuesField/               # GitHub Issues visualization
  │       ├── IssuesField.tsx        # Issues board component
  │       └── IssuesField.style.ts   # Tilled field styling
  ├── utils/
  │   └── github/                    # GitHub integration
  │       ├── client.ts              # GraphQL API client
  │       ├── horse-agent.ts         # AI agent helpers
  │       └── types.ts               # Type definitions
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

4. **Issue Fields**
   - Visualizes GitHub issues as crops in tilled fields
   - Automatic organization based on status
   - Real-time updates when issues change
   - Special handling of AI agent contributions

## Contributing

See [Contributing Guide](docs/CONTRIBUTING.md) for details on our code of conduct and development process.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Horse SVG assets from [source]
- Inspired by multiplayer game architecture patterns
- Built during an AI Agent Hackathon
