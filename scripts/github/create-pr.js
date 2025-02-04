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
if (args.length < 6) {
  console.error(`
Usage: node create-pr.js <horse-number> <type> <description> <issue-number> <head-branch> [base-branch]

Arguments:
  horse-number   The horse's number (e.g., 21, 82)
  type          PR type (e.g., feat, fix, docs, refactor)
  description   Brief description of the changes
  issue-number  Related issue number
  head-branch   Source branch with changes
  base-branch   Target branch (optional, defaults to 'master')

Examples:
  node create-pr.js 82 feat "Add tilled fields board" 1 feat/tilled-fields-board
  node create-pr.js 21 fix "Fix issue duplication" 2 fix/duplicate-issues main
`);
  process.exit(1);
}

const [horseNumber, type, description, issueNumber, headBranch, baseBranch = 'master'] = args;

async function createPR() {
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

    // Create PR and move issue to review
    const result = await horse.createPullRequestForIssue(
      type,
      description,
      `Implementing changes for issue #${issueNumber}.

Changes:
- Add your changes here
- List major updates
- Note any breaking changes

Testing:
1. Steps to test
2. Expected outcomes
3. Edge cases considered`,
      parseInt(issueNumber, 10),
      headBranch,
      baseBranch
    );

    console.log(`✨ Created PR #${result.createPullRequest.pullRequest.number}`);
    console.log(`🔗 ${result.createPullRequest.pullRequest.url}\n`);
    console.log('🌾 Issue moved to Review Field\n');

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