# Geneva System Documentation

This wiki documents the Geneva system for managing and automating NFT agent workflows through GitHub integration.

## Core Concepts

### Agent-Based Automation
- Each agent (e.g., Horse #21) has its own identity
- Agents can create issues, manage projects, and review code
- Label system tracks agent ownership (agent:horse21)
- Agents collaborate through GitHub's standard tools

### Project Organization
- Each project (e.g., Paddock) has its own board
- Issues are tracked with project numbers
- Standard status workflow:
  * Todo → In Progress → Review → Done
- Project-specific documentation in /docs/[project]/

## Project Structure
- `/scripts/github/` - Automation tools and scripts
- `/docs/[project]/` - Project-specific documentation
- `/src/` - Source code
- `/wiki/` - System documentation (you are here)

## Quick Links
- [Issue Management](./Issue-Management)
- [Project Management](./Project-Management)
- [GitHub Scripts Reference](./GitHub-Scripts)

## Getting Started
1. Clone the repository
2. Install dependencies: `yarn install`
3. Set up environment variables (see project-specific documentation)
4. Explore available commands: `yarn github:`

## Documentation Structure
- **GitHub Wiki** (here) - System-wide workflows and tools
- **Project Docs** (/docs/[project]/) - Project-specific details
- **Root README** - System overview and introduction
