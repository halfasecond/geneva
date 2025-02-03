# GitHub Integration

This document describes the GitHub integration system used in The Paddock, particularly focusing on the AI Horse agent workflow.

## Overview

The GitHub integration provides a type-safe interface for interacting with GitHub's GraphQL API, specifically focused on managing issues, pull requests, and project boards. It's designed to support automated actions by AI Horse agents.

## Key Components

### 1. GitHub Client

The `GitHubClient` class provides a base layer for interacting with GitHub's GraphQL API:

```typescript
import { GitHubClient } from '../src/utils/github';

const client = new GitHubClient({
  token: process.env.GITHUB_TOKEN,
  owner: 'org-name',
  repo: 'repo-name',
  projectNumber: 1
});
```

### 2. Horse Agents

Each AI Horse has its own agent that handles GitHub interactions with proper attribution:

```typescript
import { HorseAgent } from '../src/utils/github';

const horse82 = new HorseAgent(client, 82);

// Create an issue
await horse82.createIssue(
  'feat',
  'Add new feature',
  'Implementation details...',
  ['agent:horse82']
);

// Create a PR and move issue to review
await horse82.createPullRequestForIssue(
  'feat',
  'Add new feature',
  'Implementation details...',
  1,
  'feat/new-feature'
);
```

### 3. Project Board Integration

The system integrates with GitHub Projects v2, supporting:
- Custom field mappings
- Status transitions
- Automated issue movement

## Environment Configuration

Required environment variables:
```bash
# GitHub Personal Access Token with repo and project scopes
VITE_APP_GITHUB_TOKEN=your_token_here

# Repository and Project configuration
VITE_APP_GITHUB_REPO_OWNER=your-org
VITE_APP_GITHUB_REPO_NAME=repo-name
VITE_APP_GITHUB_PROJECT_NUMBER=1

# Project metadata (obtained via getProjectMetadata utility)
VITE_APP_GITHUB_REPO_ID=R_xxx
VITE_APP_GITHUB_PROJECT_ID=PVT_xxx
VITE_APP_GITHUB_PROJECT_STATUS_FIELD_ID=xxx
VITE_APP_GITHUB_PROJECT_TODO_OPTION_ID=xxx
VITE_APP_GITHUB_PROJECT_IN_PROGRESS_OPTION_ID=xxx
VITE_APP_GITHUB_PROJECT_IN_REVIEW_OPTION_ID=xxx
VITE_APP_GITHUB_PROJECT_DONE_OPTION_ID=xxx
```

## Horse Agent Workflow

1. Issue Creation:
   - Horse creates issue with proper attribution
   - Issue appears in "Backlog Field"
   - Issue gets agent-specific label

2. Development:
   - Horse moves issue to "Growing Field"
   - Creates feature branch
   - Implements changes

3. Pull Request:
   - Horse creates PR linking to issue
   - PR title includes horse attribution
   - Issue automatically moves to "Review Field"

4. Completion:
   - After PR merge, issue moves to "Harvested Field"

## Utilities

1. Get Project Metadata:
   ```bash
   yarn get-project-metadata
   ```

2. Create Issue as Horse:
   ```bash
   yarn create-agent-issue
   ```

3. Create PR and Move Issue:
   ```bash
   yarn create-horse82-pr
   ```

## Best Practices

1. **Attribution**: Always use the HorseAgent class to ensure proper attribution in commits, issues, and PRs.

2. **Status Updates**: Use the provided methods to update issue status to maintain consistency.

3. **Branch Names**: Follow the pattern: `type/description` (e.g., `feat/tilled-fields-board`).

4. **Commit Messages**: Format as `[Horse #XX] type: description (#issue)`.

## Error Handling

The integration includes comprehensive error handling:
- API errors with detailed messages
- Permission validation
- Project configuration checks
- Duplicate prevention

## Future Improvements

1. Real-time updates for project board changes
2. Support for multiple projects
3. Enhanced agent collaboration features
4. Automated PR reviews