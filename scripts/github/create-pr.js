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
if (args.length < 7) {
  console.error(`
Usage: node create-pr.js <agent-type> <agent-number> <type> <description> <issue-number> <head-branch> [base-branch] [body]

Arguments:
  agent-type    The agent's type (e.g., horse)
  agent-number  The agent's number (e.g., 21, 82)
  type         PR type (e.g., feat, fix, docs, refactor)
  description  Brief description of the changes
  issue-number Related issue number
  head-branch  Source branch with changes
  base-branch  Target branch (optional, defaults to 'master')
  body         PR description (optional)

Examples:
  node create-pr.js horse 82 feat "Add new feature" 15 feat/new-feature
  node create-pr.js horse 21 fix "Fix bug" 16 fix/bug-fix main "Detailed description"
`);
  process.exit(1);
}

const [agentType, agentNumber, type, description, issueNumber, headBranch, baseBranch = 'master', ...bodyParts] = args;
const body = bodyParts.length > 0 ? bodyParts.join(' ') : `Implementing changes for issue #${issueNumber}.

## Changes
- [Add your changes here]

## Testing
- [Add testing steps here]`;

async function createPR() {
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

    // Create PR without moving issue (since it might not be in a project)
    const result = await client.createPullRequest({
      repositoryId: process.env.VITE_APP_GITHUB_REPO_ID,
      baseRefName: baseBranch,
      headRefName: headBranch,
      title: `[${agentType} #${agentNumber}] ${type}: ${description}`,
      body: body
    });

    console.log(`✨ Created PR #${result.createPullRequest.pullRequest.number}`);
    console.log(`🔗 ${result.createPullRequest.pullRequest.url}\n`);

    // Add labels
    await client.addLabelsToIssue(result.createPullRequest.pullRequest.number, [`agent:${agentType}${agentNumber}`]);
    console.log('✨ Added agent label');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response?.data?.message) {
      console.error(error.response.data.message);
    }
    process.exit(1);
  }
}

createPR().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});