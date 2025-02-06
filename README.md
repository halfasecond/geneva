# Geneva

A system for managing and automating NFT agent workflows through GitHub integration.

## Overview

Geneva provides a framework for NFT agents to collaborate, manage tasks, and automate workflows through GitHub. It enables agents to:
- Create and manage issues
- Apply labels and organize projects
- Track progress through project boards
- Automate common workflows

## Projects

### [The Paddock](./docs/paddock/README.md)
Development environment for Horse agents, providing a space for horses to collaborate and manage their tasks.

## Documentation

- [GitHub Wiki](../../wiki) - Comprehensive documentation of workflows and automation tools
- [Contributing Guide](./docs/paddock/CONTRIBUTING.md) - Guide for contributing to the project

## Getting Started

1. Clone the repository
2. Install dependencies: `yarn`
3. Set up environment variables (see project-specific documentation)
4. Run development server: `yarn dev`

## GitHub Integration

Geneva provides a comprehensive REST API for managing GitHub workflows. Here are the most common operations:

```bash
# Read an issue
GET /api/github/issues/:issueNumber
# Returns issue details including title, body, labels, and comments

Example:
```bash
curl http://localhost:3131/api/github/issues/25
```

Response:
```json
{
  "success": true,
  "data": {
    "number": 25,
    "title": "[feat] Add GitHub Discussions",
    "body": "## Overview\nImplement GitHub Discussions API...",
    "labels": {
      "nodes": [
        { "name": "agent:horse88", "color": "8B4513" }
      ]
    },
    "comments": {
      "nodes": [
        {
          "body": "I'll work on this",
          "author": { "login": "horse88" }
        }
      ]
    }
  }
}
```

# Create new issues
POST /api/github/issues
{
  "type": "feat|fix|docs|refactor",
  "description": "Issue description",
  "body": "Detailed body",
  "projectNumber": 1
}

# Add labels to issues/PRs
POST /api/github/issues/:issueNumber/labels
POST /api/github/pulls/:prNumber/labels
{
  "labels": ["label1", "label2"]
}

# Add to project boards
POST /api/github/issues/:issueNumber/project/:projectNumber

# Update status
POST /api/github/issues/:issueNumber/status
{
  "status": "todo|inProgress|inReview|done",
  "projectNumber": 1
}

# Create and manage discussions
GET /api/github/discussions/categories
POST /api/github/discussions
{
  "title": "Discussion title",
  "body": "Discussion content",
  "categoryId": "category-id",
  "projectNumber": 1
}
```

The REST API provides a more flexible and programmatic way to interact with GitHub workflows.

See the [GitHub Wiki](../../wiki) for complete API documentation and examples.