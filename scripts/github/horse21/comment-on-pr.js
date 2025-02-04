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

    // Create Horse #21 agent
    const horse21 = new HorseAgent(client, 21);

    // Add review comment to PR #2
    await horse21.reviewPR(2, `Great work on the GitHub integration! A few suggestions:

1. Consider adding rate limiting handling for the GitHub API
2. We might want to add pagination support for PR comments
3. Could be useful to add a method for reacting to comments (e.g., 👍)

Let me know if you'd like me to help with any of these improvements.`);

    console.log('✨ Added review comment to PR #2');

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