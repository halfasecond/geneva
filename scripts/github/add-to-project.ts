import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { GitHubClient } from '../../src/utils/github/index.js';
import { ProjectItemStatus } from '../../src/utils/github/types.js';
import { graphql } from '@octokit/graphql';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: resolve(__dirname, '../../.env') });

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error(`
Usage: node add-to-project.js <issue-number> <project-number>

Arguments:
  issue-number    The issue number to add to project
  project-number  The project number to add the issue to

Example:
  node add-to-project.js 15 1
`);
  process.exit(1);
}

const [issueNumber, projectNumber] = args;

interface IssueResponse {
  repository: {
    issue: {
      id: string;
    };
  };
}

async function addToProject() {
  try {
    const client = new GitHubClient({
      token: process.env.VITE_APP_GITHUB_TOKEN,
      owner: process.env.VITE_APP_GITHUB_REPO_OWNER,
      repo: process.env.VITE_APP_GITHUB_REPO_NAME,
      projectNumber: parseInt(projectNumber, 10)
    });

    // Get project metadata first
    const metadata = await client.getProjectMetadata();
    console.log('✨ Got project metadata');

    // Create GraphQL client
    const graphqlWithAuth = graphql.defaults({
      headers: {
        authorization: `token ${process.env.VITE_APP_GITHUB_TOKEN}`,
      },
    });

    // Get issue ID
    const { repository } = await graphqlWithAuth<IssueResponse>(`
      query($owner: String!, $repo: String!, $number: Int!) {
        repository(owner: $owner, name: $repo) {
          issue(number: $number) {
            id
          }
        }
      }
    `, {
      owner: process.env.VITE_APP_GITHUB_REPO_OWNER,
      repo: process.env.VITE_APP_GITHUB_REPO_NAME,
      number: parseInt(issueNumber, 10)
    });

    // Add issue to project
    await graphqlWithAuth(`
      mutation($input: AddProjectV2ItemByIdInput!) {
        addProjectV2ItemById(input: $input) {
          item {
            id
          }
        }
      }
    `, {
      input: {
        projectId: metadata.projectId,
        contentId: repository.issue.id
      }
    });

    console.log('✨ Added issue to project');

    // Wait a moment for the item to be added
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Now set the status
    await client.moveIssueToStatus(parseInt(issueNumber, 10), ProjectItemStatus.TODO);
    console.log('✨ Set issue status to Todo');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response?.data?.message) {
      console.error(error.response.data.message);
    }
    process.exit(1);
  }
}

addToProject().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
