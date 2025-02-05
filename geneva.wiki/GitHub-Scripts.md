# GitHub Scripts Reference

This document provides a complete reference for all available GitHub automation commands.

## Issue Management

### Creating Issues
```bash
yarn github:issue <agent-number> <type> <description>

# Parameters:
# - agent-number: Your agent number (e.g., 82)
# - type: Issue type (feat, fix, docs, refactor)
# - description: Issue title/description

# Example:
yarn github:issue 82 feat "Add new dashboard component"
```

### Adding Labels
```bash
yarn github:labels <issue-number> <label1> [label2...]

# Parameters:
# - issue-number: The issue to label
# - label1, label2: Labels to add (e.g., agent:horse82)

# Example:
yarn github:labels 15 agent:horse82 reporter:horse21
```

### Adding to Project Board
```bash
yarn github:project <issue-number> <project-number>

# Parameters:
# - issue-number: The issue to add
# - project-number: Project board number (e.g., 1 for Paddock)

# Example:
yarn github:project 15 1
```

### Updating Status
```bash
yarn github:status <issue-number> <status>

# Parameters:
# - issue-number: The issue to update
# - status: New status (todo, inProgress, inReview, done)

# Example:
yarn github:status 15 inProgress
```

### Commenting on Issues
```bash
yarn github:comment-issue <issue-number> <comment>

# Parameters:
# - issue-number: The issue to comment on
# - comment: The comment text

# Example:
yarn github:comment-issue 15 "Great progress on this feature!"
```

## Pull Request Management

### Creating Pull Requests
```bash
yarn github:pr <branch> <title> [body]

# Parameters:
# - branch: Your feature branch name
# - title: PR title
# - body: Optional PR description

# Example:
yarn github:pr feature/new-dashboard "Add dashboard component" "Implements #15"
```

### Viewing Pull Requests
```bash
yarn github:view <pr-number>

# Parameters:
# - pr-number: The PR number to view

# Example:
yarn github:view 7
```

### Commenting on PRs
```bash
yarn github:comment-pr <pr-number> <comment>

# Parameters:
# - pr-number: The PR to comment on
# - comment: The comment text

# Example:
yarn github:comment-pr 7 "LGTM! Ready to merge."
```

### Updating PR Branches
```bash
yarn github:update-pr <pr-number>

# Parameters:
# - pr-number: The PR to update

# Example:
yarn github:update-pr 7
```

### Merging Pull Requests
```bash
yarn github:merge <pr-number> <title> [body]

# Parameters:
# - pr-number: The PR to merge
# - title: Commit title
# - body: Optional commit message

# Example:
yarn github:merge 7 "feat: Add dashboard component" "Closes #15"
```

## Project Metadata

### Getting Project Info
```bash
yarn github:metadata

# No parameters - displays project configuration and metadata

# Example:
yarn github:metadata
```

## Best Practices

1. Issue Creation
   - Use clear, descriptive titles
   - Include relevant context
   - Reference related issues/PRs
   - Follow type prefix conventions

2. Status Management
   - Keep status up to date
   - Move through proper workflow
   - Update when significant changes occur

3. Pull Requests
   - Reference related issues
   - Provide clear descriptions
   - Keep changes focused
   - Update branch when needed

4. Comments
   - Be clear and constructive
   - Reference relevant code/issues
   - Provide context for decisions
   - Keep discussion on-topic