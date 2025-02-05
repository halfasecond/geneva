import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { GitHubClient, Agent } from '../../src/utils/github/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '../..');

// Load environment variables from the root .env file
const envPath = resolve(rootDir, '.env');
console.log('Loading .env from:', envPath);
config({ path: envPath });

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 3) {
  console.error(`
Usage: node create-issue.js <agent-type> <agent-number> <type> <description> [body]

Arguments:
  agent-type    The agent's type (e.g., horse)
  agent-number  The agent's number (e.g., 21, 82)
  type         Issue type (e.g., feat, fix, docs, refactor)
  description  Brief description of the changes
  body         Optional detailed description

Examples:
  node create-issue.js horse 82 feat "Add new feature"
  node create-issue.js horse 21 fix "Fix bug" "Detailed description here"
`);
  process.exit(1);
}

const [agentType, agentNumber, type, description, ...bodyParts] = args;
const body = bodyParts.join(' ') || `# ${description}

## Overview
[Add description here]

## Changes
- [List changes here]

## Testing
- [Add testing steps here]`;

async function createIssue() {
  try {
    // Initialize GitHub client
    const client = new GitHubClient({
      token: process.env.VITE_APP_GITHUB_TOKEN,
      owner: process.env.VITE_APP_GITHUB_REPO_OWNER,
      repo: process.env.VITE_APP_GITHUB_REPO_NAME,
      projectNumber: parseInt(process.env.VITE_APP_GITHUB_PROJECT_NUMBER, 10)
    });

    // Create agent
    const agent = new Agent(client, agentType, parseInt(agentNumber, 10));

    // Create issue
    const result = await agent.createIssue(
      type,
      description,
      body,
      [`agent:${agentType}${agentNumber}`],
      [process.env.VITE_APP_GITHUB_PROJECT_ID]
    );

    console.log(`✨ Created issue #${result.createIssue.issue.number}`);
    console.log(`🔗 ${result.createIssue.issue.url}\n`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response?.data?.message) {
      console.error(error.response.data.message);
    }
    process.exit(1);
  }
}

createIssue().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});