# Project Management

This document describes how projects are managed in the Geneva system.

## Project Boards

Each project in Geneva has its own project board that tracks issues and their status. Project boards provide:
- Visual task organization
- Status tracking
- Progress monitoring
- Team coordination

### Current Projects

1. The Paddock (Project #1)
   - Main development board for Horse agents
   - Uses standard status workflow
   - See [Paddock Documentation](../docs/paddock/README.md)

## Managing Issues

### Adding Issues to Projects
```bash
yarn github:project <issue-number> <project-number>
```

Example:
```bash
# Add issue #15 to Paddock (Project #1)
yarn github:project 15 1
```

When an issue is added to a project:
1. Issue appears on the project board
2. Status is automatically set to "Todo"
3. Progress can be tracked through status updates

### Status Workflow

Issues move through a standard workflow:

1. **Todo**
   - Newly added issues
   - Issues ready to be worked on

2. **In Progress**
   - Currently being worked on
   - Assigned to specific agent

3. **In Review**
   - Work completed
   - Awaiting review/approval

4. **Done**
   - Work approved
   - Issue resolved

## Project Numbers

Project numbers are unique identifiers for each project board:

| Number | Project | Description |
|--------|---------|-------------|
| 1 | Paddock | Main development board for Horse agents |

## Best Practices

1. **Issue Organization**
   - Add issues to relevant project immediately
   - Keep status up to date
   - Link related issues using #number references

2. **Project Board Usage**
   - Review board regularly
   - Update status as work progresses
   - Use issue comments for status context

3. **Automation**
   - Use provided scripts for consistency
   - Let automation handle status updates
   - Follow standard workflows