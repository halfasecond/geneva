import { graphql } from '@octokit/graphql';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the root .env file
config({ path: resolve(__dirname, '../.env') });

const graphqlWithAuth = graphql.defaults({
  headers: {
    authorization: `token ${process.env.VITE_APP_GITHUB_TOKEN}`,
  },
});

async function displayProjectMetadata() {
  const owner = process.env.VITE_APP_GITHUB_REPO_OWNER;
  const repo = process.env.VITE_APP_GITHUB_REPO_NAME;
  const projectNumber = process.env.VITE_APP_GITHUB_PROJECT_NUMBER;

  if (!owner || !repo || !projectNumber) {
    console.error('\n❌ Missing required environment variables. Please check your .env file:');
    console.error('VITE_APP_GITHUB_REPO_OWNER');
    console.error('VITE_APP_GITHUB_REPO_NAME');
    console.error('VITE_APP_GITHUB_PROJECT_NUMBER\n');
    process.exit(1);
  }

  try {
    console.log('\n🐎 Fetching project metadata...\n');

    const query = `
      query($owner: String!, $repo: String!, $projectNumber: Int!) {
        repository(owner: $owner, name: $repo) {
          id
          projectV2(number: $projectNumber) {
            id
            fields(first: 20) {
              nodes {
                ... on ProjectV2SingleSelectField {
                  id
                  name
                  options {
                    id
                    name
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await graphqlWithAuth(query, {
      owner,
      repo,
      projectNumber: parseInt(projectNumber, 10),
    });

    const statusField = response.repository.projectV2.fields.nodes.find(
      (field) => field.name === 'Status'
    );

    if (!statusField) {
      throw new Error('Status field not found in project');
    }

    const getOptionId = (name) => {
      const option = statusField.options.find(
        (opt) => opt.name.toLowerCase() === name.toLowerCase()
      );
      if (!option) {
        throw new Error(`Status option "${name}" not found`);
      }
      return option.id;
    };

    const metadata = {
      repositoryId: response.repository.id,
      projectId: response.repository.projectV2.id,
      statusFieldId: statusField.id,
      statusOptionIds: {
        todo: getOptionId('Todo'),
        inProgress: getOptionId('In Progress'),
        inReview: getOptionId('In Review'),
        done: getOptionId('Done'),
      },
    };

    console.log('✨ Add these variables to your .env file:\n');
    console.log(`VITE_APP_GITHUB_REPO_ID=${metadata.repositoryId}`);
    console.log(`VITE_APP_GITHUB_PROJECT_ID=${metadata.projectId}`);
    console.log(`VITE_APP_GITHUB_PROJECT_STATUS_FIELD_ID=${metadata.statusFieldId}`);
    console.log(`VITE_APP_GITHUB_PROJECT_TODO_OPTION_ID=${metadata.statusOptionIds.todo}`);
    console.log(`VITE_APP_GITHUB_PROJECT_IN_PROGRESS_OPTION_ID=${metadata.statusOptionIds.inProgress}`);
    console.log(`VITE_APP_GITHUB_PROJECT_IN_REVIEW_OPTION_ID=${metadata.statusOptionIds.inReview}`);
    console.log(`VITE_APP_GITHUB_PROJECT_DONE_OPTION_ID=${metadata.statusOptionIds.done}\n`);

    console.log('🌾 After adding these variables, you can create issues using:');
    console.log('yarn create-agent-issue\n');

  } catch (error) {
    console.error('\n❌ Error fetching project metadata:');
    if (error.message) {
      console.error(error.message);
    }
    if (error.response?.data?.message) {
      console.error(error.response.data.message);
    }
    console.error('\nPlease check:');
    console.error('1. Your GitHub token has the correct permissions');
    console.error('2. The repository and project exist');
    console.error('3. You have access to the repository and project\n');
    process.exit(1);
  }
}

displayProjectMetadata().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});