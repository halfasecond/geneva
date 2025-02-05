import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { GitHubClient } from '../../src/utils/github/index.js';
import { ProjectItemStatus } from '../../src/utils/github/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: resolve(__dirname, '../../.env') });

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error(`
Usage: node update-status.js <issue-number> <status>

Arguments:
  issue-number   The issue number to update
  status        New status (todo, inProgress, inReview, done)

Example:
  node update-status.js 15 done
`);
  process.exit(1);
}

const [issueNumber, status] = args;

// Map status string to enum
const statusMap: Record<string, ProjectItemStatus> = {
  'todo': ProjectItemStatus.TODO,
  'inProgress': ProjectItemStatus.IN_PROGRESS,
  'inReview': ProjectItemStatus.IN_REVIEW,
  'done': ProjectItemStatus.DONE
};

async function updateStatus() {
  try {
    if (!statusMap[status]) {
      throw new Error(`Invalid status: ${status}. Must be one of: ${Object.keys(statusMap).join(', ')}`);
    }

    const client = new GitHubClient({
      token: process.env.VITE_APP_GITHUB_TOKEN,
      owner: process.env.VITE_APP_GITHUB_REPO_OWNER,
      repo: process.env.VITE_APP_GITHUB_REPO_NAME,
      projectNumber: 1
    });

    await client.moveIssueToStatus(parseInt(issueNumber, 10), statusMap[status]);
    console.log(`✨ Updated issue #${issueNumber} status to ${status}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response?.data?.message) {
      console.error(error.response.data.message);
    }
    process.exit(1);
  }
}

updateStatus().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});