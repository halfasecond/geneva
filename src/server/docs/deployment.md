# Deployment Guide

This guide covers deploying the application in various environments. The application is designed to be deployed as a single unit, with the server handling both API requests and serving the static frontend files.

## Prerequisites

- Node.js 18+
- MongoDB
- Web3 provider (e.g., QuickNode)
- Docker (optional)

## Environment Setup

1. **Environment Variables**

Create a `.env.production` file with:
```env
# Server Configuration
PORT=3131
HOST=0.0.0.0

# MongoDB Configuration
MONGODB_URI=mongodb://your-mongodb-uri

# Web3 Configuration
WEB3_SOCKET_URL=your-web3-websocket-url
CHAIN_ID=1

# GitHub Configuration (if using)
GITHUB_TOKEN=your-github-token
GITHUB_OWNER=your-github-username
GITHUB_REPO=your-repo-name
```

2. **Build Configuration**

The build process is configured in:
- `vite.config.ts` for frontend
- `tsconfig.node.json` for server

## Deployment Options

### 1. Docker Deployment (Recommended)

The simplest deployment method using our Docker setup:

```bash
# Build the production image
docker build -t geneva-game .

# Run the container
docker run -p 3131:3131 \
  --env-file .env.production \
  geneva-game
```

#### Docker Compose

For more complex setups with MongoDB:

```yaml
version: '3'
services:
  app:
    build: .
    ports:
      - "3131:3131"
    env_file:
      - .env.production
    depends_on:
      - mongo

  mongo:
    image: mongo:latest
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
```

### 2. Traditional Deployment

For deploying without Docker:

1. **Build the Application**
```bash
# Install dependencies
yarn install

# Build frontend
yarn build
```

2. **Start the Server**
```bash
# Start production server
yarn start
```

### 3. Cloud Deployment

#### AWS Elastic Beanstalk

1. Create Elastic Beanstalk environment
2. Configure environment variables
3. Deploy using the Elastic Beanstalk CLI:
```bash
eb deploy
```

#### Digital Ocean

1. Create a new app
2. Connect to GitHub repository
3. Configure environment variables
4. Deploy

## Production Considerations

### 1. Performance

The server is configured to:
- Serve static files efficiently
- Handle WebSocket connections
- Manage database connections
- Process Web3 events

### 2. Security

Important security measures:
- CORS configuration
- Rate limiting
- Environment variable protection
- WebSocket authentication

### 3. Monitoring

Consider implementing:
- Server health checks
- Performance monitoring
- Error tracking
- Usage analytics

### 4. Scaling

The application can be scaled by:
- Using load balancers
- Implementing caching
- Optimizing database queries
- Using CDN for static assets

## Maintenance

### 1. Updates

To update the application:
1. Pull latest changes
2. Build new version
3. Deploy using preferred method
4. Monitor for any issues

### 2. Backups

Regular backups of:
- MongoDB data
- Environment configurations
- Logs

### 3. Troubleshooting

Common production issues:

1. **Connection Issues**
   - Check MongoDB connection
   - Verify Web3 provider status
   - Check network configurations

2. **Performance Issues**
   - Monitor server resources
   - Check database performance
   - Review WebSocket connections

3. **Build Issues**
   - Verify environment variables
   - Check build logs
   - Review dependency versions

## Rollback Procedure

If deployment fails:

1. Stop the new deployment
2. Restore previous version
3. Verify database state
4. Check logs for issues
5. Fix and redeploy

## Health Checks

Implement health checks for:
1. Server status
2. Database connection
3. Web3 connection
4. WebSocket server

Example endpoint: `/api/health`

## Logging

Configure logging for:
- Server events
- API requests
- WebSocket events
- Database operations
- Web3 interactions

## SSL/TLS

For HTTPS:
1. Obtain SSL certificate
2. Configure in server
3. Update WebSocket to WSS
4. Update client configurations

## Continuous Integration/Deployment

Example GitHub Actions workflow:

```yaml
name: CI/CD

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install Dependencies
        run: yarn install
      - name: Build
        run: yarn build
      - name: Deploy
        run: yarn deploy # Custom deploy script
```

## Support

For production support:
1. Monitor server logs
2. Check system resources
3. Review error reports
4. Maintain backup systems
5. Keep documentation updated