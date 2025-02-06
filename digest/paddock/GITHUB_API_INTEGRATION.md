# Integrating GitHub API with Existing Server

## Overview

The GitHub API can be integrated into the existing Vite plugin game server architecture, leveraging the established infrastructure while maintaining separation of concerns.

## Integration Architecture

### 1. Extended Vite Plugin

```typescript
// src/server/vite-plugin-game-server.ts
import { Plugin } from 'vite'
import { setupSocketServer } from './socket'
import { setupGitHubServer } from './github'

export function gameServer(): Plugin {
    return {
        name: 'vite-plugin-game-server',
        configureServer(server) {
            // Set up existing socket server
            setupSocketServer(server.httpServer!)
            
            // Set up new GitHub API routes
            setupGitHubServer(server.middlewares)

            server.httpServer?.once('listening', () => {
                const address = server.httpServer?.address()
                if (address && typeof address !== 'string') {
                    console.log(`Game server running on port ${address.port}`)
                    console.log('GitHub API endpoints available at /api/github/*')
                }
            })
        }
    }
}
```

### 2. GitHub Server Setup

```typescript
// src/server/github/index.ts
import express from 'express'
import { GitHubClient } from '../../utils/github/client'
import { setupGitHubRoutes } from './routes'
import { gitHubMiddleware } from './middleware'

export function setupGitHubServer(app: express.Application) {
    // Initialize GitHub client
    const client = new GitHubClient({
        token: process.env.GITHUB_TOKEN!,
        owner: process.env.GITHUB_OWNER!,
        repo: process.env.GITHUB_REPO!,
        projectNumber: Number(process.env.GITHUB_PROJECT_NUMBER!)
    })

    // Set up GitHub API middleware
    app.use('/api/github', gitHubMiddleware)

    // Mount GitHub routes
    setupGitHubRoutes(app, client)
}
```

### 3. GitHub Routes

```typescript
// src/server/github/routes.ts
import express from 'express'
import { GitHubClient } from '../../utils/github/client'
import { validateAgent } from './middleware'

export function setupGitHubRoutes(
    app: express.Application,
    client: GitHubClient
) {
    const router = express.Router()

    // Issue routes
    router.post('/issues', validateAgent, async (req, res) => {
        const { agent, type, description, body } = req.body
        try {
            const result = await client.createIssue({
                title: `[${type}] ${description}`,
                body: formatIssueBody(agent, body),
                repositoryId: process.env.GITHUB_REPOSITORY_ID!
            })
            res.json(result)
        } catch (error) {
            handleError(res, error)
        }
    })

    // Project routes
    router.post('/projects', validateAgent, async (req, res) => {
        const { issueNumber, projectNumber } = req.body
        try {
            const result = await client.addIssueToProject(
                issueNumber,
                projectNumber
            )
            res.json(result)
        } catch (error) {
            handleError(res, error)
        }
    })

    // Mount routes
    app.use('/api/github', router)
}
```

### 4. GitHub Middleware

```typescript
// src/server/github/middleware.ts
import { Request, Response, NextFunction } from 'express'

export function gitHubMiddleware(req: Request, res: Response, next: NextFunction) {
    // Add common headers
    res.setHeader('X-GitHub-Agent', 'Horse-Paddock')
    
    // Parse agent from request
    const agent = req.headers['x-agent-id']
    if (!agent) {
        return res.status(400).json({
            error: 'Missing agent ID header'
        })
    }
    
    // Add to request context
    req.agent = agent
    next()
}

export function validateAgent(req: Request, res: Response, next: NextFunction) {
    const { agent } = req.body
    if (!agent || !agent.match(/^horse\d+$/)) {
        return res.status(400).json({
            error: 'Invalid agent format. Must be horse<number>'
        })
    }
    next()
}
```

### 5. Error Handling

```typescript
// src/server/github/errors.ts
import { Response } from 'express'
import { GitHubError } from '../../utils/github/types'

export function handleError(res: Response, error: GitHubError) {
    console.error('GitHub API Error:', error)
    
    const status = error.response?.status || 500
    const message = error.response?.data?.message || error.message
    
    res.status(status).json({
        error: message,
        details: error.response?.data
    })
}
```

## Benefits of Integration

1. **Unified Server**
   - Single server instance
   - Shared middleware and utilities
   - Consistent error handling
   - Centralized logging

2. **Development Experience**
   - Same dev server handles all requests
   - Hot module reloading for API changes
   - Unified environment configuration
   - Simplified debugging

3. **Resource Efficiency**
   - Shared connections and resources
   - No separate process needed
   - Better memory utilization
   - Reduced deployment complexity

4. **Type Safety**
   - Reuse existing GitHub client types
   - Full TypeScript support
   - Consistent error types
   - Better IDE integration

## Migration Strategy

### Phase 1: Setup
1. Add GitHub server setup to Vite plugin
2. Implement core middleware
3. Add basic routes
4. Set up error handling

### Phase 2: Route Migration
1. Move existing script functionality to routes
2. Add validation and middleware
3. Implement SDK methods
4. Update documentation

### Phase 3: Client Updates
1. Update frontend to use new API
2. Add compatibility layer
3. Deprecate CLI scripts
4. Remove package.json entries

## Configuration

```env
# .env
GITHUB_TOKEN=xxx
GITHUB_OWNER=paddock-org
GITHUB_REPO=horse-paddock
GITHUB_PROJECT_NUMBER=1
GITHUB_REPOSITORY_ID=xxx
```

## Next Steps

1. Create proof of concept PR
2. Add tests for new endpoints
3. Update agent documentation
4. Create migration guide
5. Implement monitoring

Remember: This integration maintains the existing server architecture while adding GitHub capabilities in a clean, maintainable way.