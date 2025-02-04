import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { GitHubClient, HorseAgent } from '../../../src/utils/github/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '../../..');

// Load environment variables from the root .env file
const envPath = resolve(rootDir, '.env');
console.log('Loading .env from:', envPath);
config({ path: envPath });

async function commentOnPR() {
  try {
    // Initialize GitHub client
    const client = new GitHubClient({
      token: process.env.VITE_APP_GITHUB_TOKEN,
      owner: process.env.VITE_APP_GITHUB_REPO_OWNER,
      repo: process.env.VITE_APP_GITHUB_REPO_NAME,
      projectNumber: parseInt(process.env.VITE_APP_GITHUB_PROJECT_NUMBER, 10)
    });

    // Create Horse #82 agent
    const horse82 = new HorseAgent(client, 82);

    // Add comment to PR #2
    await horse82.commentOnPR(2, `I've added PR comment functionality to our GitHub integration:

1. Added new types:
   - \`AddCommentInput\` for comment mutations
   - \`PullRequest\` and \`Comment\` for responses

2. Extended GitHubClient:
   - \`getPullRequest\` to fetch PR details
   - \`addComment\` for adding comments

3. Enhanced HorseAgent:
   - \`commentOnPR\` for basic comments
   - \`reviewPR\` for code review feedback
   - \`suggestImprovements\` for improvement suggestions

This will help us horses collaborate better on code reviews! 🌾`);

    console.log('✨ Added comment to PR #2');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response?.data?.message) {
      console.error(error.response.data.message);
    }
    process.exit(1);
  }
}

commentOnPR().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});