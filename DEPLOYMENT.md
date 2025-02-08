# Deployment Guide

## Deployment Options

This guide outlines deployment options for the Paddock:
1. OneSec: Full-stack deployment with real-time features
2. GitHub Pages: Serverless deployment for static content

## 1. OneSec Deployment (Full Stack)

OneSec is OpSec's peer-to-peer deployment service (https://docs.opsec.computer/getting-started/onesec).

### Prerequisites

1. GitHub repository with the Paddock codebase
2. OpSec account with access to OneSec deployment service
3. GitHub Personal Access Token with required permissions

### Environment Configuration

Configure in OneSec's dashboard:

```env
# GitHub Integration
GITHUB_TOKEN=your_github_token
GITHUB_OWNER=your_org_or_username
GITHUB_REPO=your_repository_name

# Deployment Mode
VITE_SERVERLESS=false

# Game Server
VITE_GAME_SERVER_URL=your_game_server_url

# GitHub Project
VITE_APP_GITHUB_PROJECT_NUMBER=1
```

### Deployment Steps

1. Connect your GitHub repository to OneSec
2. Configure environment variables
3. OneSec auto-detects Vite configuration
4. Both frontend and game server distributed across peer-to-peer network

## 2. GitHub Pages Deployment (Serverless)

For a serverless deployment without backend dependencies.

### Prerequisites

1. GitHub repository with the Paddock codebase
2. GitHub Pages enabled in repository settings

### Environment Configuration

Configure the following in your GitHub repository secrets:

```env
# GitHub Integration (for build process)
GITHUB_TOKEN=your_github_token
GITHUB_OWNER=your_org_or_username
GITHUB_REPO=your_repository_name

# Deployment Mode
VITE_SERVERLESS=true
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

Serverless deployment has some limitations:
- No real-time multiplayer
- Uses demo data for Issues Board
- No WebSocket features

## Feature Comparison

### OneSec Deployment
✅ Full multiplayer support
✅ Real-time issue updates
✅ WebSocket features
✅ Peer-to-peer networking
✅ Auto-scaling

### GitHub Pages (Serverless)
✅ Simple deployment
✅ No external dependencies
✅ Fast page loads
✅ Demo issue board
❌ No multiplayer
❌ No real-time updates

## Development Environment

### Local Development
- Clone the repository
- Copy .env.example to .env
- Configure environment variables
- Run development server: `yarn dev`

### Testing Different Modes

1. Full Stack Mode:
```env
VITE_SERVERLESS=false
```

2. Serverless Mode:
```env
VITE_SERVERLESS=true
```

**Important**: Always restart the development server after changing environment variables for the changes to take effect.

### Common Issues

1. **Environment Changes Not Reflected**
   - Ensure you've restarted the development server
   - Check .env file values are correct
   - Verify no conflicting values in other .env files

2. **Mode Switching**
   - Stop the development server
   - Update VITE_SERVERLESS value
   - Start the server again
   - Clear browser cache if needed

## Monitoring and Maintenance

1. **Health Checks**
   - Monitor build status
   - Check GitHub API rate limits
   - Verify deployment URLs

2. **Updates and Rollbacks**
   - Use GitHub releases for version control
   - Monitor deployment logs
   - GitHub Actions provides deployment history

## Security Considerations

1. **Environment Variables**
   - Never commit sensitive values
   - Use platform-specific secure storage
   - Rotate GitHub tokens periodically

2. **Access Control**
   - Configure proper CORS settings
   - Secure API endpoints
   - Monitor GitHub webhook events

## Support and Resources

- [OpSec Platform Documentation](https://www.opsec.computer/docs)
- [OneSec Deployment Guide](https://docs.opsec.computer/getting-started/onesec)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vite Deployment Guide](https://vitejs.dev/guide/build.html)