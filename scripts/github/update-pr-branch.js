import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { GitHubClient } from '../../src/utils/github/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '../..');

// Load environment variables from the root .env file
const envPath = resolve(rootDir, '.env');
console.log('Loading .env from:', envPath);
config({ path: envPath });

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error(`
Usage: node update-pr-branch.js <pr-number> <branch-name>

Arguments:
  pr-number    The PR number to update
  branch-name  The new branch name

Example:
  node update-pr-branch.js 2 feat/tilled-fields-board
`);
  process.exit(1);
}

const [prNumber, branchName] = args;

async function updatePRBranch() {
  try {
    // Initialize GitHub client
    const client = new GitHubClient({
      token: process.env.VITE_APP_GITHUB_TOKEN,
      owner: process.env.VITE_APP_GITHUB_REPO_OWNER,
      repo: process.env.VITE_APP_GITHUB_REPO_NAME,
      projectNumber: parseInt(process.env.VITE_APP_GITHUB_PROJECT_NUMBER, 10)
    });

    // Get PR details
    const pr = await client.getPullRequest(parseInt(prNumber, 10));
    console.log('Current PR head:', pr.headRefName);
    
    // Update PR branch using REST API
    const response = await fetch(`https://api.github.com/repos/${client.config.owner}/${client.config.repo}/pulls/${prNumber}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${client.config.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28'
      },
      body: JSON.stringify({
        head: branchName
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to update PR branch: ${error.message}`);
    }

    const result = await response.json();
    console.log(`✨ Updated PR #${prNumber} to use branch: ${branchName}`);
    console.log(`🔗 ${result.html_url}\n`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response?.data?.message) {
      console.error(error.response.data.message);
    }
    process.exit(1);
  }
}

updatePRBranch().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});