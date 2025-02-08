# Deployment Guide

## Decentralized Paddock Deployment with OpSec

This guide outlines the steps to deploy decentralized Paddock instances using OpSec's peer-to-peer hosting platform (https://www.opsec.computer/).

### Vision

The Paddock is designed to be fully decentralized:
- Horse NFTs and SVGs are stored on-chain
- Frontend and game server hosted across OpSec's peer-to-peer network
- Local paddock instances can be run independently
- Real-time communication through Socket.io

### Prerequisites

1. GitHub repository with the Paddock codebase
2. GitHub Personal Access Token with required permissions
3. OpSec account and access to their dashboard
4. (Optional) Local environment for running personal paddock instance

### Environment Configuration

Create the following environment variables in OpSec's dashboard:

```env
# GitHub Integration
GITHUB_TOKEN=your_github_token
GITHUB_OWNER=your_org_or_username
GITHUB_REPO=your_repository_name

# Game Server
VITE_GAME_SERVER_URL=your_game_server_url
```

### Deployment Options

#### 1. OpSec Peer-to-Peer Deployment
- Connect your GitHub repository to OpSec
- Configure environment variables
- OpSec auto-detects Vite configuration and Socket.io server
- Both frontend and game server distributed across peer-to-peer network

#### 2. Local Paddock Instance
- Clone the repository
- Copy .env.production.example to .env.production
- Configure local environment variables
- Run development server: `yarn dev`
- Connect to other paddock instances through peer network

### Real-time Communication

Socket.io Implementation:
- Leverages OpSec's Next.js support for Socket.io capabilities
- Real-time updates through distributed network
- Seamless multiplayer interactions
- Automatic scaling across peer-to-peer nodes

### Development vs Production

- **Development**: 
  - Runs both frontend and game server locally
  - Uses localhost:3131 for WebSocket connections
  - Uses local .env file

- **Production**:
  - Frontend and game server distributed across OpSec's network
  - Socket.io connections managed by OpSec's platform
  - Environment variables from OpSec dashboard

### Monitoring and Maintenance

1. **Health Checks**
   - Monitor Socket.io connections
   - Check GitHub API rate limits
   - Verify real-time updates

2. **Updates and Rollbacks**
   - OpSec handles automatic deployments
   - Use GitHub releases for version control
   - Monitor deployment logs

### Security Considerations

1. **Environment Variables**
   - Never commit sensitive values
   - Use OpSec's secure storage
   - Rotate GitHub tokens periodically

2. **Access Control**
   - Implement proper Socket.io authentication
   - Secure WebSocket connections
   - Monitor GitHub webhook events

### Support and Resources

- [OpSec Documentation](https://www.opsec.computer/docs)
- [GitHub API Documentation](https://docs.github.com/en/rest)
- [Vite Deployment Guide](https://vitejs.dev/guide/build.html)
- [Socket.io Documentation](https://socket.io/docs/v4)

### Troubleshooting

Common issues and solutions:

1. **Socket.io Connection Issues**
   - Verify OpSec WebSocket configuration
   - Check Socket.io server settings
   - Ensure proper connection URLs

2. **GitHub Integration Issues**
   - Verify token permissions
   - Check rate limit usage
   - Confirm environment variables

3. **Build Failures**
   - Review OpSec build logs
   - Verify vite.config.ts settings
   - Check for missing dependencies