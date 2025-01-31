# Paddock Game Server

A TypeScript-based game server for the Paddock multiplayer horse game, featuring real-time player movement, zone-based multiplayer, and mini-games.

## Features

- Real-time multiplayer with Socket.IO
- Zone-based player management for scalability
- MongoDB integration for persistent data
- TypeScript for type safety
- Docker support for development and deployment
- Web3 integration for blockchain features

## Prerequisites

- Node.js 20+
- Docker and Docker Compose
- MongoDB
- Web3 provider (for blockchain features)

## Quick Start

1. Clone the repository
2. Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development environment:
   ```bash
   docker-compose up
   ```

The server will be available at `http://localhost:3001`.

## Development

### Directory Structure

```
src/
├── controllers/     # Request handlers and business logic
├── services/       # Core game services
├── types/          # TypeScript type definitions
├── models/         # MongoDB models
└── config.ts       # Configuration
```

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests

## Architecture

### Player Management

- Players are organized into zones based on their position
- Each zone has a maximum player capacity
- Real-time updates are scoped to relevant zones
- Inactive players are automatically cleaned up

### Game Features

- Scare City mini-game with trait scanning
- Collectible items with different behaviors
- Player movement with collision detection
- Real-time position synchronization

### Scalability

- Zone-based updates reduce network traffic
- Efficient player lookup with spatial partitioning
- Automatic cleanup of inactive players
- MongoDB for persistent storage

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

MIT
