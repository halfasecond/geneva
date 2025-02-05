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
2. Install dependencies: `yarn install`
3. Set up environment variables (see project-specific documentation)
4. Run development server: `yarn dev`

## GitHub Integration

Geneva provides several command-line tools for managing GitHub workflows:

```bash
# Create new issues
yarn github:issue <horse-number> <type> <description>

# Add labels to issues
yarn github:labels <issue-number> <label1> [label2...]

# Add issues to project boards
yarn github:project <issue-number> <project-number>
```

See the [GitHub Wiki](../../wiki) for complete documentation of available tools and workflows.