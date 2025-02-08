# Deployment Guide

## Deployment Options

This guide outlines two deployment options for the Paddock:
1. OneSec: Full-stack deployment with real-time features
2. GitHub Pages: Static deployment for frontend-only scenarios

## 1. OneSec Deployment

OneSec is OpSec's peer-to-peer deployment service (https://docs.opsec.computer/getting-started/onesec).

### Vision

The Paddock is designed to be fully decentralized:
- Horse NFTs and SVGs are stored on-chain
- Frontend and game server hosted across OpSec's peer-to-peer network
- Local paddock instances can be run independently
- Real-time communication through Socket.io

### Prerequisites

1. GitHub repository with the Paddock codebase
2. GitHub Personal Access Token with required permissions
3. OpSec account with access to OneSec deployment service
4. (Optional) Local environment for running personal paddock instance

### Environment Configuration

Create the following environment variables in the OneSec deployment dashboard:

```env
# GitHub Integration
GITHUB_TOKEN=your_github_token
GITHUB_OWNER=your_org_or_username
GITHUB_REPO=your_repository_name

# Game Server
VITE_GAME_SERVER_URL=your_game_server_url
```

### Deployment Steps

1. Connect your GitHub repository to OneSec
2. Configure environment variables
3. OneSec auto-detects Vite configuration and Socket.io server
4. Both frontend and game server distributed across peer-to-peer network

## 2. GitHub Pages Deployment

GitHub Pages provides a simpler deployment option for static content.

### Prerequisites

1. GitHub repository with the Paddock codebase
2. GitHub Pages enabled in repository settings
3. GitHub Personal Access Token with required permissions

### Environment Configuration

Configure the following secrets in your GitHub repository:

```env
# GitHub Integration
GITHUB_TOKEN=your_github_token
GITHUB_OWNER=your_org_or_username
GITHUB_REPO=your_repository_name

# Game Server (if using external server)
VITE_GAME_SERVER_URL=your_game_server_url
```

### Deployment Steps

1. Enable GitHub Pages in repository settings:
   - Go to Settings > Pages
   - Set source to "GitHub Actions"

2. The workflow will automatically:
   - Build the project
   - Deploy to GitHub Pages
   - Provide deployment URL

3. Deployments trigger on:
   - Push to main branch
   - Manual workflow dispatch

### Limitations

GitHub Pages deployment has some limitations:
- Static content only
- No built-in WebSocket support
- Requires external game server for multiplayer features

## Development Environment

### Local Development
- Clone the repository
- Copy .env.production.example to .env.production
- Configure local environment variables
- Run development server: `yarn dev`

### Real-time Features

Socket.io Implementation:
- OneSec: Full WebSocket support through platform
- GitHub Pages: Requires external WebSocket server
- Local: Uses localhost:3131 for development

## Monitoring and Maintenance

1. **Health Checks**
   - Monitor Socket.io connections
   - Check GitHub API rate limits
   - Verify real-time updates

2. **Updates and Rollbacks**
   - OneSec: Automatic deployments
   - GitHub Pages: Through Actions workflow
   - Use GitHub releases for version control

## Security Considerations

1. **Environment Variables**
   - Never commit sensitive values
   - Use platform-specific secure storage
   - Rotate GitHub tokens periodically

2. **Access Control**
   - Implement proper Socket.io authentication
   - Secure WebSocket connections
   - Monitor GitHub webhook events

## Support and Resources

- [OpSec Platform Documentation](https://www.opsec.computer/docs)
- [OneSec Deployment Guide](https://docs.opsec.computer/getting-started/onesec)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vite Deployment Guide](https://vitejs.dev/guide/build.html)
- [Socket.io Documentation](https://socket.io/docs/v4)

## Troubleshooting

Common issues and solutions:

1. **Socket.io Connection Issues**
   - Verify WebSocket configuration
   - Check server settings
   - Ensure proper connection URLs

2. **GitHub Integration Issues**
   - Verify token permissions
   - Check rate limit usage
   - Confirm environment variables

3. **Build Failures**
   - Review build logs
   - Verify vite.config.ts settings
   - Check for missing dependencies