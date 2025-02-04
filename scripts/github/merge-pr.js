import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { GitHubClient, HorseAgent } from '../../src/utils/github/index.js';

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
Usage: node merge-pr.js <horse-number> <pr-number>

Arguments:
  horse-number   The horse's number (e.g., 21, 82)
  pr-number      The PR number to merge

Example:
  node merge-pr.js 100 2  # Horse #100 merges PR #2
`);
  process.exit(1);
}

const [horseNumber, prNumber] = args;

async function mergePR() {
  try {
    // Initialize GitHub client
    const client = new GitHubClient({
      token: process.env.VITE_APP_GITHUB_TOKEN,
      owner: process.env.VITE_APP_GITHUB_REPO_OWNER,
      repo: process.env.VITE_APP_GITHUB_REPO_NAME,
      projectNumber: parseInt(process.env.VITE_APP_GITHUB_PROJECT_NUMBER, 10)
    });

    // Create horse agent
    const horse = new HorseAgent(client, parseInt(horseNumber, 10));

    // Get PR details first
    const pr = await client.getPullRequest(parseInt(prNumber, 10));
    
    // Merge the PR
    const result = await client.mergePullRequest({
      pullRequestId: pr.id,
      mergeMethod: 'SQUASH',
      commitHeadline: `[Horse #${horseNumber}] Merge PR #${prNumber} (${pr.title})`,
      commitBody: `Approved by Horse #21\nMerged by Horse #${horseNumber} 🐎`
    });

    console.log(`✨ Merged PR #${prNumber}`);
    console.log(`🔗 ${pr.url}\n`);

    // Add merge comment
    await horse.commentOnPR(parseInt(prNumber, 10), `Merged this PR! 🌾

Thanks for the contributions and reviews. The changes are now in the master branch.`);

    console.log('✨ Added merge comment');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
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