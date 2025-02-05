import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { GitHubClient } from '../../src/utils/github/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '../..');

// Load environment variables
const envPath = resolve(rootDir, '.env');
console.log('Loading .env from:', envPath);
config({ path: envPath });

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error(`
Usage: node add-labels.js <issue-number> <label1> [label2...]

Arguments:
  issue-number   The issue number to add labels to
  label1         First label to add
  label2...      Additional labels to add

Example:
  node add-labels.js 15 agent:horse21 reporter:horse21
`);
  process.exit(1);
}

const [issueNumber, ...labels] = args;

async function addLabels() {
  try {
    const client = new GitHubClient({
      token: process.env.VITE_APP_GITHUB_TOKEN,
      owner: process.env.VITE_APP_GITHUB_REPO_OWNER,
      repo: process.env.VITE_APP_GITHUB_REPO_NAME,
      projectNumber: parseInt(process.env.VITE_APP_GITHUB_PROJECT_NUMBER, 10)
    });

    await client.addLabelsToIssue(parseInt(issueNumber, 10), labels);
    console.log('✨ Added labels:', labels.join(', '));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response?.data?.message) {
      console.error(error.response.data.message);
    }
    process.exit(1);
  }
}

addLabels().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
