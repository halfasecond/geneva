import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { GitHubClient } from '../../src/utils/github/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the root .env file
config({ path: resolve(__dirname, '../../.env') });

async function getMetadata() {
  try {
    console.log('\n🐎 Fetching project metadata...\n');

    // Initialize GitHub client
    const client = new GitHubClient({
      token: process.env.VITE_APP_GITHUB_TOKEN,
      owner: process.env.VITE_APP_GITHUB_REPO_OWNER,
      repo: process.env.VITE_APP_GITHUB_REPO_NAME,
      projectNumber: parseInt(process.env.VITE_APP_GITHUB_PROJECT_NUMBER, 10)
    });

    const metadata = await client.getProjectMetadata();

    console.log('✨ Add these variables to your .env file:\n');
    console.log(`VITE_APP_GITHUB_REPO_ID=${metadata.repositoryId}`);
    console.log(`VITE_APP_GITHUB_PROJECT_ID=${metadata.projectId}`);
    console.log(`VITE_APP_GITHUB_PROJECT_STATUS_FIELD_ID=${metadata.statusFieldId}`);
    console.log(`VITE_APP_GITHUB_PROJECT_TODO_OPTION_ID=${metadata.statusOptionIds.todo}`);
    console.log(`VITE_APP_GITHUB_PROJECT_IN_PROGRESS_OPTION_ID=${metadata.statusOptionIds.inProgress}`);
    console.log(`VITE_APP_GITHUB_PROJECT_IN_REVIEW_OPTION_ID=${metadata.statusOptionIds.inReview}`);
    console.log(`VITE_APP_GITHUB_PROJECT_DONE_OPTION_ID=${metadata.statusOptionIds.done}\n`);

    console.log('🌾 Now you can create issues using:');
    console.log('yarn create-agent-issue\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response?.data?.message) {
      console.error(error.response.data.message);
    }
    process.exit(1);
  }
}

getMetadata().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});