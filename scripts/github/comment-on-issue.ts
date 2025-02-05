import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { GitHubClient } from '../../src/utils/github/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: resolve(__dirname, '../../.env') });

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error(`
Usage: node comment-on-issue.js <issue-number> <comment>

Arguments:
  issue-number   The issue number to comment on
  comment       The comment text to add

Example:
  node comment-on-issue.js 15 "Great work on this feature!"
`);
  process.exit(1);
}

const [issueNumber, ...commentParts] = args;
const comment = commentParts.join(' ');

async function addComment() {
  try {
    const client = new GitHubClient({
      token: process.env.VITE_APP_GITHUB_TOKEN,
      owner: process.env.VITE_APP_GITHUB_REPO_OWNER,
      repo: process.env.VITE_APP_GITHUB_REPO_NAME,
      projectNumber: 1
    });

    await client.addIssueComment(parseInt(issueNumber, 10), comment);
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