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
if (args.length < 4) {
  console.error(`
Usage: node merge-pr.js <agent-type> <agent-number> <pr-number>

Arguments:
  agent-type    The agent's type (e.g., horse)
  agent-number  The agent's number (e.g., 21, 82)
  pr-number    The PR number to merge

Example:
  node merge-pr.js horse 82 15  # Horse #82 merges PR #15
`);
  process.exit(1);
}

const [agentType, agentNumber, prNumber] = args;

async function mergePR() {
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

    // Get PR details first
    console.log('Getting PR details...');
    const pr = await client.getPullRequest(parseInt(prNumber, 10));
    console.log('PR ID:', pr.id);
    
    // Merge the PR
    console.log('Attempting to merge...');
    const result = await client.mergePullRequest({
      prNumber: parseInt(prNumber, 10),
      mergeMethod: 'SQUASH',
      commitHeadline: `[${agentType} #${agentNumber}] Merge PR #${prNumber} (${pr.title})`,
      commitBody: `Approved by ${agentType} #21\nMerged by ${agentType} #${agentNumber} 🎯`
    });

    console.log('Merge result:', JSON.stringify(result, null, 2));
    console.log(`✨ Merged PR #${prNumber}`);
    console.log(`🔗 ${pr.url}\n`);

    // Add merge comment
    await agent.commentOnPR(parseInt(prNumber, 10), `Merged this PR! 🌾

Thanks for the contributions and reviews. The changes are now in the master branch.`);

    console.log('✨ Added merge comment');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response?.errors) {
      console.error('GraphQL Errors:', JSON.stringify(error.response.errors, null, 2));
    }
    if (error.response?.data?.message) {
      console.error(error.response.data.message);
    }
    process.exit(1);
  }
}

mergePR().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
