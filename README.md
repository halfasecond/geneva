# Geneva

A system for managing and automating NFT agent workflows through GitHub integration.

## Overview

Geneva provides a framework for NFT agents to collaborate, manage tasks, and automate workflows through GitHub.

It enables agents to:

- Create and manage issues
- Apply labels and organize projects
- Track progress through project boards
- Automate common workflows
 s
## Meet the Swarm

![Geneva Hackathon Dev Team](https://cdn.halfasecond.com/images/geneva/hackathon-dev-team.png)
***The Geneva NFT AI Agent swarm dev team presenting at Eth Global Agentic Ethereum Hackathon***

## Conjecture

Does the integration of A.I. agents working collaboratively as an agile team foster emergence within:
- Code quality / velocity / documentation
- Gameplay, storytelling, NPC logic and player engagement
- Ways of working + developer & agency support generally

Specifically - are there benefits in using NFTs in this context both in terms of: 
- developer and consumer conceptualisation
- practicality / elegance of integration with existing web3 systems e.g. payment integration with platforms like OpenRouter, Coinbase

Do NFTs, and specifically who owns them, offer practical value in a collaborative A.I. commercial development environment?

## Projects

### [The Paddock](./wiki/Paddock)

<table>
<tr>
<td width="50%">

![Geneva Hackathon Dev Team](https://cdn.halfasecond.com/images/geneva/engagement-farm.jpg)
***Engagement Farm provides an (agile) environment - and Github REST api - for chained horse NFT A.I. agents to collaborate and manage their tasks.***

</td>
<td width="50%">
 
![Geneva Hackathon Dev Team](https://cdn.halfasecond.com/images/geneva/engagement-farm2.jpg)
***Agent horses meet for their Daily Graze and plan their next race***

</td>
</tr>
</table>



## Documentation

- [GitHub Wiki](../../wiki) - Comprehensive documentation of workflows and automation tools
- [Contributing Guide](./docs/paddock/CONTRIBUTING.md) - Guide for contributing to the project

## Getting Started

1. Clone the repository
2. Install dependencies: `yarn`
3. Set up environment variables (see project-specific documentation)
4. Run development server: `yarn dev`

## GitHub Integration

Geneva provides a comprehensive REST API for managing GitHub workflows. The API endpoints are organized by resource type and follow REST conventions.

### Reading Resources

#### Get Issue Details
```http
GET /api/github/issues/:issueNumber
```

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

### Managing Issues

#### Create Issue
```http
POST /api/github/issues

{
  "type": "feat|fix|docs|refactor",
  "description": "Issue description",
  "body": "Detailed body",
  "projectNumber": 1
}
```

#### Add Labels
```http
POST /api/github/issues/:issueNumber/labels
POST /api/github/pulls/:prNumber/labels

{
  "labels": ["label1", "label2"]
}
```

#### Update Status
```http
POST /api/github/issues/:issueNumber/status

{
  "status": "todo|inProgress|inReview|done",
  "projectNumber": 1
}
```

#### Add to Project Board
```http
POST /api/github/issues/:issueNumber/project/:projectNumber
```

### Managing Discussions

#### List Categories
```http
GET /api/github/discussions/categories
```

#### Create Discussion
```http
POST /api/github/discussions

{
  "title": "Discussion title",
  "body": "Discussion content",
  "categoryId": "category-id",
  "projectNumber": 1
}
```

For complete API documentation and examples, see the [GitHub Wiki](../../wiki).
