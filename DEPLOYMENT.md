# Deployment Guide

## Deployment Options

This guide outlines deployment options for the Paddock, with recommendations based on feature requirements.

## 1. OneSec Deployment (Recommended)

OneSec is OpSec's peer-to-peer deployment service (https://docs.opsec.computer/getting-started/onesec) that provides full support for our real-time features.

### Why OneSec?

- Full WebSocket support through Next.js integration
- Complete peer-to-peer deployment
- Maintains decentralized vision
- All features work out of the box
- No additional infrastructure needed

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

## 2. GitHub Pages Deployment (Limited Support)

GitHub Pages provides static file hosting only. **Important Note:** This option requires additional infrastructure for real-time features.

### Limitations

- No WebSocket server support (static hosting only)
- Requires external game server for multiplayer
- Introduces centralization through external dependencies
- Not recommended for full feature deployment

### Prerequisites

1. GitHub repository with the Paddock codebase
2. GitHub Pages enabled in repository settings
3. GitHub Personal Access Token with required permissions
4. External server for WebSocket support (if needed)

### Environment Configuration

Configure the following secrets in your GitHub repository:

```env
# GitHub Integration
GITHUB_TOKEN=your_github_token
GITHUB_OWNER=your_org_or_username
GITHUB_REPO=your_repository_name

# Game Server (required for multiplayer)
VITE_GAME_SERVER_URL=your_external_server_url
```

### Deployment Steps

1. Enable GitHub Pages in repository settings:
   - Go to Settings > Pages
   - Set source to "GitHub Actions"

2. The workflow will automatically:
   - Build the project
   - Deploy to GitHub Pages
   - Provide deployment URL

3. For multiplayer support:
   - Deploy game server separately
   - Configure VITE_GAME_SERVER_URL to point to your server
   - Update CORS settings on the server

## Development Environment

### Local Development
- Clone the repository
- Copy .env.production.example to .env.production
- Configure local environment variables
- Run development server: `yarn dev`

### Real-time Features

Socket.io Implementation:
- OneSec: Full WebSocket support through platform
- GitHub Pages: Requires external server setup
- Local: Uses localhost:3131 for development

## Future Considerations

### WebRTC Integration
- Potential for true peer-to-peer connections
- No central server requirement
- Would require architecture changes
- Could enable fully decentralized multiplayer

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