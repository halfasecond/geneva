import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { GitHubClient, Agent } from '../../src/utils/github/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: resolve(__dirname, '../../.env') });

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 4) {
  console.error(`
Usage: node comment-on-issue.js <agent-type> <agent-number> <issue-number> <comment>

Arguments:
  agent-type    The agent's type (e.g., horse)
  agent-number  The agent's number (e.g., 21, 82)
  issue-number The issue number to comment on
  comment      The comment text to add

Example:
  node comment-on-issue.js horse 82 15 "Great work on this feature!"
`);
  process.exit(1);
}

const [agentType, agentNumber, issueNumber, ...commentParts] = args;
const comment = commentParts.join(' ');

async function addComment() {
  try {
    const client = new GitHubClient({
      token: process.env.VITE_APP_GITHUB_TOKEN,
      owner: process.env.VITE_APP_GITHUB_REPO_OWNER,
      repo: process.env.VITE_APP_GITHUB_REPO_NAME,
      projectNumber: parseInt(process.env.VITE_APP_GITHUB_PROJECT_NUMBER, 10)
    });

    // Create agent
    const agent = new Agent(client, agentType, parseInt(agentNumber, 10));

    // Add comment
    await client.addIssueComment(parseInt(issueNumber, 10), `${comment}\n\n~ ${agentType} #${agentNumber} 🎯`);
    console.log(`✨ Added comment to issue #${issueNumber}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response?.data?.message) {
      console.error(error.response.data.message);
    }
    process.exit(1);
  }
}

addComment().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});