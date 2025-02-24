# Geneva Game

A web3-enabled game platform with integrated GitHub project management and real-time multiplayer capabilities.

## Overview

This project combines:
- React frontend with Vite
- Express backend with Socket.IO
- MongoDB for persistence
- Web3 integration for blockchain interaction
- GitHub integration for project management

## Quick Start

1. **Clone and Install**
```bash
git clone https://github.com/halfasecond/geneva.git
cd geneva
yarn install
```

2. **Set Up Environment**
```bash
# Copy example env files
cp .env.example .env
cp src/server/.env.example src/server/.env

# Edit .env files with your configuration
```

3. **Development**
```bash
# Start development environment
docker-compose up
```

4. **Production**
```bash
# Build and start production server
yarn build
yarn start
```

## Development Environment

The project uses a unified development environment that combines client and server development in a single container/VSCode window. This approach provides:

- Hot Module Replacement (HMR) for both client and server code
- Integrated debugging
- Real-time updates
- Simplified development workflow

See [Development Guide](./docs/development.md) for detailed information about the development environment and workflow.

## Deployment

The application can be deployed as a single unit, with the server handling both API requests and serving static frontend files.

See [Deployment Guide](./docs/deployment.md) for detailed deployment instructions and options.

## Project Structure

```
.
├── docs/                 # Documentation
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   ├── contracts/       # Web3 contract definitions
│   ├── server/         # Backend server code
│   │   ├── config/     # Server configuration
│   │   ├── modules/    # Server modules
│   │   └── types/      # TypeScript definitions
│   ├── style/          # Global styles
│   └── utils/          # Shared utilities
├── .env.example        # Example environment variables
├── docker-compose.yml  # Docker configuration
├── package.json        # Project dependencies
└── vite.config.ts     # Vite configuration
```

## Key Features

- **Real-time Game Engine**: Socket.IO-based multiplayer system
- **Web3 Integration**: Blockchain interaction and NFT support
- **GitHub Integration**: Project management and issue tracking
- **Modern Development**: TypeScript, React, Vite
- **Docker Support**: Containerized development and deployment
- **Unified Dev Environment**: Single window development

## Contributing

1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Submit a pull request

See [Development Guide](./docs/development.md) for coding standards and workflow.

## Scripts

- `yarn dev`: Start development environment
- `yarn build`: Build for production
- `yarn start`: Start production server
- `yarn test`: Run tests
- `yarn lint`: Run linter

## Environment Variables

Key environment variables:

```env
# Server
PORT=3131
HOST=0.0.0.0

# MongoDB
MONGODB_URI=mongodb://localhost:27017/geneva

# Web3
WEB3_SOCKET_URL=your-web3-websocket-url
CHAIN_ID=1

# GitHub (optional)
GITHUB_TOKEN=your-github-token
GITHUB_OWNER=your-username
GITHUB_REPO=your-repo
```

See `.env.example` for all available options.

## License

[MIT License](LICENSE)

## Support

For issues and feature requests, please use the GitHub issue tracker.
