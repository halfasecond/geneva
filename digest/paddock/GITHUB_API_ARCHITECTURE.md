# GitHub Integration API Architecture

## Current Pain Points

1. **Command-Line Overhead**
   - Multiple separate CLI scripts
   - Complex command syntax for agents
   - Package.json script proliferation
   - Limited error handling and validation

2. **Development Friction**
   - Agents must context switch to terminal
   - No unified interface
   - Limited reusability
   - No middleware capabilities

3. **Maintenance Challenges**
   - Scripts scattered across files
   - Duplicate code patterns
   - No centralized logging
   - Limited extensibility

## Proposed API Architecture

### 1. Core API Server

```typescript
// src/github-api/server.ts
import express from 'express';
import { GitHubClient } from '../utils/github/client';

export class GitHubAPIServer {
  private app: express.Application;
  private client: GitHubClient;

  constructor(config: GitHubConfig) {
    this.app = express();
    this.client = new GitHubClient(config);
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(express.json());
    this.app.use(this.validateAgent);
    this.app.use(this.logRequest);
  }

  private setupRoutes() {
    this.app.post('/api/issues', this.createIssue);
    this.app.post('/api/labels', this.addLabels);
    this.app.post('/api/projects', this.addToProject);
    // ... other routes
  }
}
```

### 2. Unified Request Handler

```typescript
// src/github-api/handlers.ts
export class GitHubHandlers {
  async createIssue(req: Request, res: Response) {
    const { agent, type, description, body } = req.body;
    
    try {
      const result = await this.client.createIssue({
        title: `[${type}] ${description}`,
        body: this.formatIssueBody(agent, body),
        repositoryId: this.config.repositoryId
      });
      
      res.json(result);
    } catch (error) {
      this.handleError(res, error);
    }
  }
}
```

### 3. Agent Client SDK

```typescript
// src/github-api/sdk.ts
export class GitHubAgentSDK {
  constructor(private agent: string) {}

  async createIssue(type: string, description: string) {
    return this.post('/api/issues', {
      agent: this.agent,
      type,
      description
    });
  }

  async addToProject(issueNumber: number, projectNumber: number) {
    return this.post('/api/projects', {
      issueNumber,
      projectNumber
    });
  }
}
```

## Key Improvements

### 1. Unified Interface
- Single HTTP API endpoint
- Consistent request/response format
- Built-in validation
- Proper error handling

### 2. Enhanced Developer Experience
```typescript
// Example agent usage
const github = new GitHubAgentSDK('horse88');

// Create issue
const issue = await github.createIssue('feat', 'Add new component');

// Add to project
await github.addToProject(issue.number, 1);

// Add labels
await github.addLabels(issue.number, ['agent:horse88']);
```

### 3. Middleware Capabilities
- Request validation
- Authentication
- Rate limiting
- Logging
- Error handling

### 4. Advanced Features

1. **Batch Operations**
```typescript
// Create issue with labels and project in one call
await github.createIssueWithMetadata({
  type: 'feat',
  description: 'New feature',
  labels: ['agent:horse88'],
  project: 1
});
```

2. **Webhooks Support**
```typescript
// Subscribe to issue events
github.on('issue.created', async (issue) => {
  console.log(`Issue #${issue.number} created`);
});
```

3. **Status Tracking**
```typescript
// Track operation status
const operation = await github.trackOperation(
  github.createIssue('feat', 'New feature')
);

console.log(operation.status); // 'pending', 'completed', 'failed'
```

## Migration Strategy

### Phase 1: API Server Setup
1. Implement core API server
2. Add basic routes
3. Set up middleware
4. Add error handling

### Phase 2: Client SDK
1. Create TypeScript SDK
2. Add convenience methods
3. Implement batching
4. Add event system

### Phase 3: Script Migration
1. Update existing scripts to use SDK
2. Add compatibility layer
3. Deprecate old scripts
4. Remove package.json clutter

## Benefits

1. **Developer Experience**
   - Simple, intuitive API
   - TypeScript autocomplete
   - Better error messages
   - Reduced context switching

2. **Maintainability**
   - Centralized logic
   - Easier testing
   - Better monitoring
   - Simplified deployment

3. **Extensibility**
   - Easy to add features
   - Plugin system
   - Event hooks
   - Custom middleware

4. **Performance**
   - Request batching
   - Caching
   - Rate limiting
   - Connection pooling

## Next Steps

1. Create proof of concept
2. Get feedback from agents
3. Implement core features
4. Create migration guide
5. Update documentation

Remember: The goal is to make GitHub interactions more natural and efficient for AI agents while maintaining the playful horse-themed approach that makes our system unique.