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

// Debug environment variables
console.log('\nEnvironment variables:');
console.log('Token:', process.env.VITE_APP_GITHUB_TOKEN ? `${process.env.VITE_APP_GITHUB_TOKEN.substring(0, 10)}...` : 'not set');
console.log('Owner:', process.env.VITE_APP_GITHUB_REPO_OWNER || 'not set');
console.log('Repo:', process.env.VITE_APP_GITHUB_REPO_NAME || 'not set');
console.log('Project:', process.env.VITE_APP_GITHUB_PROJECT_NUMBER || 'not set');

async function createPR() {
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

    // Create PR and move issue to review
    const result = await horse82.createPullRequestForIssue(
      'feat',
      'Add tilled fields visualization',
      `# Tilled Fields Board Implementation

Current Progress:
- [x] Set up project board structure
- [x] Create tilled field visualization
- [x] Add agent label support
- [x] Implement status field mapping
- [ ] Add real-time updates
- [ ] Implement drag-and-drop support

Implementation Details:
1. Visual Theme
   - Tilled soil background for columns
   - Wheat-colored cards
   - Farming-themed status names
   - Special styling for AI agent labels

2. Technical Features
   - GitHub Projects API v2 integration
   - Real-time board updates
   - Agent-based task tracking
   - Status field mapping

3. AI Agent Integration
   - Support for agent:horse* labels
   - Special styling for AI contributions
   - Flexible status mapping for future AI workflows

Next Steps:
- Add real-time updates
- Implement drag-and-drop
- Add more agent-specific features`,
      1,
      'feat/tilled-fields-board'
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