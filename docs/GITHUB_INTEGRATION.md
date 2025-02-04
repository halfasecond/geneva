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
   ```bash
   # Create a new issue
   yarn github:issue <horse-number> <type> <description> [body]

   # Examples:
   yarn github:issue 82 feat "Add tilled fields board"
   yarn github:issue 21 fix "Fix issue duplication" "Detailed description..."
   ```

2. Development:
   - Horse moves issue to "Growing Field"
   - Creates feature branch
   - Implements changes

3. Pull Request Creation:
   ```bash
   # Create a PR and move issue to review
   yarn github:pr <horse-number> <type> <description> <issue-number> <head-branch> [base-branch]

   # Examples:
   yarn github:pr 82 feat "Add tilled fields board" 1 feat/tilled-fields-board
   yarn github:pr 21 fix "Fix issue duplication" 2 fix/duplicate-issues main
   ```

4. PR Comments:
   ```bash
   # Add a general comment
   yarn github:comment <horse-number> <pr-number> comment "Great progress!"

   # Add a code review
   yarn github:comment <horse-number> <pr-number> review "Code looks good..."

   # Suggest improvements
   yarn github:comment <horse-number> <pr-number> suggest "Consider adding..."
   ```

5. Completion:
   - After PR merge, issue moves to "Harvested Field"

## Utilities

1. Get Project Metadata:
   ```bash
   yarn github:metadata
   ```

2. Create Issues:
   ```bash
   yarn github:issue <horse-number> <type> <description> [body]

   # Arguments:
   # - horse-number: The horse's number (e.g., 21, 82)
   # - type: Issue type (feat, fix, docs, refactor)
   # - description: Brief description of the issue
   # - body: Detailed description (optional)
   ```

3. Create Pull Requests:
   ```bash
   yarn github:pr <horse-number> <type> <description> <issue-number> <head-branch> [base-branch]

   # Arguments:
   # - horse-number: The horse's number (e.g., 21, 82)
   # - type: PR type (feat, fix, docs, refactor)
   # - description: Brief description of changes
   # - issue-number: Related issue number
   # - head-branch: Source branch with changes
   # - base-branch: Target branch (optional, defaults to 'master')
   ```

4. Comment on PRs:
   ```bash
   yarn github:comment <horse-number> <pr-number> <comment-type> [comment]

   # Comment types:
   # - comment: General comment
   # - review: Code review feedback
   # - suggest: Improvement suggestions
   ```

## Best Practices

1. **Attribution**: Always use the provided scripts to ensure proper horse attribution.

2. **Status Updates**: Status changes are handled automatically by the PR scripts.

3. **Branch Names**: Follow the pattern: `type/description-issue` (e.g., `feat/tilled-fields-board-1`).
   - Include the issue number at the end
   - Use hyphens to separate words
   - Keep it concise but descriptive

4. **Commit Messages**: Format as `[Horse #XX] type: description (#issue)`.

5. **Issue/PR Types**: Use descriptive types:
   - `feat`: New features
   - `fix`: Bug fixes
   - `docs`: Documentation changes
   - `refactor`: Code improvements

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
5. Support for multi-line comments from files
6. Issue template support