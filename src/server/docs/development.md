# Development Environment

This project uses a unified development environment that combines both client and server development in a single container/VSCode window. This approach simplifies development while maintaining a clean separation for production builds.

## Architecture Overview

The project consists of:
- React frontend (Vite-based)
- Express backend
- WebSocket server (Socket.IO)
- MongoDB database
- Web3 integration

## Development Mode

In development, everything runs in a single process thanks to Vite's plugin system:

```bash
yarn dev
```

This command:
1. Starts Vite's development server with hot module replacement (HMR)
2. Loads the game server through a custom Vite plugin (`vite-plugin-game-server`)
3. Connects to MongoDB and Web3
4. Provides real-time updates for both client and server code

### How It Works

The `vite-plugin-game-server.ts` plugin:
- Integrates with Vite's dev server
- Mounts Express routes under the module's name e.g. `/chained-horse`
- Sets up modular / secure Socket.IO for real-time communication
- Handles cleanup on server shutdown

Key files:
- `vite.config.ts`: Configures Vite and loads the game server plugin
- `src/server/vite-plugin-game-server.ts`: Integrates server with Vite
- `src/server/index.ts`: Main server entry point

## Production Mode

For production, the setup cleanly separates into static files and server:

```bash
yarn build
yarn start
```

This:
1. Builds the React app into static files (`dist/`)
2. Starts the production server that:
   - Serves static files
   - Handles API routes
   - Manages WebSocket connections
   - Connects to MongoDB and Web3

## Docker Integration

The development environment runs in a Docker container, providing:
- Consistent development environment
- Easy setup for new developers
- Production-like environment in development
- Simple deployment path

Key files:
- `Dockerfile`: Production container definition
- `Dockerfile.dev`: Development container with live reload
- `docker-compose.yml`: Service orchestration

## Environment Variables

The project uses different .env files for different environments:
- `.env`: Development variables
- `.env.production`: Production variables
- `src/server/.env`: Server-specific variables

## Key Features

1. **Unified Development**
   - Single terminal window
   - Real-time updates for both client and server
   - Integrated debugging

2. **Clean Architecture**
   - Clear separation of concerns
   - Modular server design
   - Type-safe communication

3. **Developer Experience**
   - Hot module replacement
   - TypeScript throughout
   - VSCode integration
   - Docker-based workflow

4. **Production Ready**
   - Optimized builds
   - Static file serving
   - Clean separation of concerns
   - Easy deployment

## Common Tasks

### Starting Development

```bash
# Start development environment
docker-compose up
```

### Building for Production

```bash
# Build static files
yarn build

# Start production server
yarn start
```

### Adding New Routes

1. Create new route file in `src/server/modules/[module]/routes/`
2. Export router
3. Import in module's index.ts
4. Server automatically picks up changes in development

### Adding New Components

1. Create component in `src/components/`
2. Import and use
3. HMR automatically updates the view

## Best Practices

1. **Type Safety**
   - Use TypeScript for all new code
   - Define interfaces for API responses
   - Use shared types between client and server

2. **Module Structure**
   - Keep related code together
   - Use feature-based organization
   - Share common utilities

3. **State Management**
   - Use React hooks for local state
   - Socket.IO for real-time updates
   - MongoDB for persistence

4. **Error Handling**
   - Proper error boundaries in React
   - Consistent error responses from API
   - Logging in production

## Troubleshooting

Common issues and solutions:

1. **Port Conflicts**
   - Default port is 3131
   - Change in .env file if needed
   - Check for running processes

2. **Database Connection**
   - Ensure MongoDB is running
   - Check connection string
   - Verify network access

3. **WebSocket Issues**
   - Check Socket.IO connection
   - Verify port access
   - Check client configuration

## Future Improvements

Potential areas for enhancement:

1. **Build Process**
   - Further optimization of builds
   - Better code splitting
   - Improved asset handling

2. **Development Experience**
   - Enhanced hot reload
   - Better error reporting
   - Improved debugging tools

3. **Testing**
   - Expanded test coverage
   - Integration testing
   - E2E testing setup