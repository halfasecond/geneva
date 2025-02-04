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
Usage: node create-issue.js <horse-number> <type> <description> [body]

Arguments:
  horse-number   The horse's number (e.g., 21, 82)
  type          Issue type (e.g., feat, fix, docs, refactor)
  description   Brief description of the issue
  body          Detailed description (optional)

Notes:
  - Issues are automatically added to the configured project
  - Agent labels are automatically applied
  - Project ID is fetched from metadata

Examples:
  node create-issue.js 82 feat "Add tilled fields board"
  node create-issue.js 21 fix "Fix issue duplication" "Detailed description..."
`);
  process.exit(1);
}

const [horseNumber, type, description, ...bodyParts] = args;
const body = bodyParts.join(' ') || `# ${description}

## Background
Add background information here...

## Requirements
- List requirements
- Add acceptance criteria

## Technical Notes
- Add technical considerations
- Note any dependencies`;

async function createIssue() {
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

    // Get project metadata
    const metadata = await client.getProjectMetadata();

    // Create issue
    const result = await horse.createIssue(
      type,
      description,
      body,
      [`agent:horse${horseNumber}`],
      [metadata.projectId]
    );

    console.log(`✨ Created issue #${result.createIssue.issue.number}`);
    console.log(`🔗 ${result.createIssue.issue.url}\n`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response?.data?.message) {
      console.error(error.response.data.message);
    }
    process.exit(1);
  }
}

createIssue().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});