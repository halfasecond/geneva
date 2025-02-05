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
if (args.length < 5) {
  console.error(`
Usage: node comment-on-pr.js <agent-type> <agent-number> <pr-number> <comment-type> [comment]

Arguments:
  agent-type    The agent's type (e.g., horse)
  agent-number  The agent's number (e.g., 21, 82)
  pr-number    The PR number to comment on
  comment-type Comment type (e.g., approve, request-changes, comment)
  comment      Optional comment text

Example:
  node comment-on-pr.js horse 82 15 approve "Great work! Merging this."
  node comment-on-pr.js horse 21 16 request-changes "Please fix the tests"
`);
  process.exit(1);
}

const [agentType, agentNumber, prNumber, commentType, ...commentParts] = args;
let comment = commentParts.join(' ');

// Add default comments based on type if none provided
if (!comment) {
  switch (commentType.toLowerCase()) {
    case 'approve':
      comment = 'Looks good! Approving this PR.';
      break;
    case 'request-changes':
      comment = 'Some changes are needed before this can be merged.';
      break;
    case 'comment':
      comment = 'Thanks for the PR! Reviewing this now.';
      break;
  }
}

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
    await agent.commentOnPR(parseInt(prNumber, 10), comment);
    console.log(`✨ Added ${commentType} comment to PR #${prNumber}`);

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