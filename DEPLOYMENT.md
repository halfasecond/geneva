# Deployment Guide

## MVP Deployment with OneSec

This guide outlines the steps to deploy the Paddock MVP using OneSec's decentralized hosting platform.

### Prerequisites

1. GitHub repository with the Paddock codebase
2. GitHub Personal Access Token with required permissions
3. OneSec account and access to their dashboard

### Environment Configuration

Create the following environment variables in OneSec's dashboard:

```env
# GitHub Integration
GITHUB_TOKEN=your_github_token
GITHUB_OWNER=your_org_or_username
GITHUB_REPO=your_repository_name

# Game Server
VITE_GAME_SERVER_URL=your_game_server_url
```

### Deployment Steps

1. **Game Server Setup**
   - Deploy the game server component to your preferred hosting platform
   - Configure CORS to allow requests from your OneSec domain
   - Update VITE_GAME_SERVER_URL to point to your deployed game server

2. **Frontend Deployment**
   - Connect your GitHub repository to OneSec
   - OneSec will automatically detect the Vite configuration
   - Configure environment variables in OneSec dashboard
   - Push changes to trigger automatic deployment

3. **Verify Deployment**
   - Check WebSocket connections are working
   - Verify GitHub integration functionality
   - Test multiplayer features
   - Confirm environment variables are properly set

### Development vs Production

The application is configured to handle different environments:

- **Development**: 
  - Runs both frontend and game server locally
  - Uses localhost:3131 for WebSocket connections
  - Uses local .env file

- **Production**:
  - Frontend hosted on OneSec's decentralized network
  - Game server runs as separate service
  - Uses production environment variables from OneSec

### Monitoring and Maintenance

1. **Health Checks**
   - Monitor WebSocket connections
   - Check GitHub API rate limits
   - Verify real-time updates

2. **Updates and Rollbacks**
   - OneSec handles automatic deployments on push
   - Use GitHub releases for version control
   - Monitor deployment logs in OneSec dashboard

### Troubleshooting

Common issues and solutions:

1. **WebSocket Connection Failures**
   - Verify VITE_GAME_SERVER_URL is correct
   - Check CORS configuration on game server
   - Ensure WebSocket port is open and accessible

2. **GitHub Integration Issues**
   - Verify GitHub token permissions
   - Check rate limit usage
   - Confirm environment variables are set

3. **Build Failures**
   - Review OneSec build logs
   - Verify vite.config.ts settings
   - Check for missing dependencies

### Security Considerations

1. **Environment Variables**
   - Never commit sensitive values to repository
   - Use OneSec's secure environment variable storage
   - Rotate GitHub tokens periodically

2. **Access Control**
   - Implement proper CORS policies
   - Secure WebSocket connections
   - Monitor GitHub webhook events

### Support and Resources

- [OneSec Documentation](https://docs.onesec.dev)
- [GitHub API Documentation](https://docs.github.com/en/rest)
- [Vite Deployment Guide](https://vitejs.dev/guide/build.html)