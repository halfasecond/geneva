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
if (args.length < 3) {
  console.error(`
Usage: node comment-on-pr.js <horse-number> <pr-number> <comment-type> [comment]

Arguments:
  horse-number   The horse's number (e.g., 21, 82)
  pr-number      The PR number to comment on
  comment-type   Type of comment: 'comment', 'review', or 'suggest'
  comment        The comment text (optional, will prompt if not provided)

Examples:
  node comment-on-pr.js 82 2 comment "Great work on this PR!"
  node comment-on-pr.js 21 2 review "Code looks good, just a few suggestions..."
  node comment-on-pr.js 82 2 suggest "Consider adding error handling"
`);
  process.exit(1);
}

const [horseNumber, prNumber, commentType, ...commentParts] = args;
let comment = commentParts.join(' ');

// If no comment provided, prompt for it
if (!comment) {
  console.error('Error: Comment text is required');
  process.exit(1);
}

async function addComment() {
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

    // Add comment based on type
    switch (commentType) {
      case 'review':
        await horse.reviewPR(parseInt(prNumber, 10), comment);
        break;
      case 'suggest':
        await horse.suggestImprovements(parseInt(prNumber, 10), [comment]);
        break;
      case 'comment':
        await horse.commentOnPR(parseInt(prNumber, 10), comment);
        break;
      default:
        console.error('Error: Invalid comment type. Must be "comment", "review", or "suggest"');
        process.exit(1);
    }

    console.log(`✨ Added ${commentType} to PR #${prNumber}`);

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