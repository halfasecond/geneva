import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { GitHubClient } from '../../src/utils/github/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '../..');

// Load environment variables from the root .env file
const envPath = resolve(rootDir, '.env');
console.log('Loading .env from:', envPath);
config({ path: envPath });

async function viewProject() {
  try {
    // Initialize GitHub client
    const client = new GitHubClient({
      token: process.env.VITE_APP_GITHUB_TOKEN,
      owner: process.env.VITE_APP_GITHUB_REPO_OWNER,
      repo: process.env.VITE_APP_GITHUB_REPO_NAME,
      projectNumber: parseInt(process.env.VITE_APP_GITHUB_PROJECT_NUMBER, 10)
    });

    // Get project items from repository
    const query = `
      query($owner: String!, $repo: String!, $number: Int!) {
        repository(owner: $owner, name: $repo) {
          projectV2(number: $number) {
            items(first: 100) {
              nodes {
                id
                fieldValues(first: 8) {
                  nodes {
                    ... on ProjectV2ItemFieldSingleSelectValue {
                      name
                      field {
                        ... on ProjectV2SingleSelectField {
                          name
                        }
                      }
                    }
                  }
                }
                content {
                  __typename
                  ... on Issue {
                    id
                    title
                    number
                    url
                    labels(first: 10) {
                      nodes {
                        id
                        name
                        color
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    console.log('Fetching project data with:', {
      owner: process.env.VITE_APP_GITHUB_REPO_OWNER,
      repo: process.env.VITE_APP_GITHUB_REPO_NAME,
      number: parseInt(process.env.VITE_APP_GITHUB_PROJECT_NUMBER, 10)
    });

    const response = await client.graphqlWithAuth(query, {
      owner: process.env.VITE_APP_GITHUB_REPO_OWNER,
      repo: process.env.VITE_APP_GITHUB_REPO_NAME,
      number: parseInt(process.env.VITE_APP_GITHUB_PROJECT_NUMBER, 10)
    });

    console.log('API Response:', JSON.stringify(response, null, 2));

    const items = response.repository.projectV2.items.nodes;
    const statusMap = new Map();

    // Status mapping from IssuesField
    const STATUS_MAPPING = {
      'todo': 'Backlog Field 🌱',
      'in progress': 'Growing Field 🌾',
      'in review': 'Review Field 🌿',
      'done': 'Harvested Field 🌾',
      'Todo': 'Backlog Field 🌱',
      'In Progress': 'Growing Field 🌾',
      'In Review': 'Review Field 🌿',
      'Done': 'Harvested Field 🌾',
      'default': 'Backlog Field 🌱'
    };

    // Group items by status
    items.forEach(item => {
      if (!item.content || item.content.__typename !== 'Issue') return;

      const statusNode = item.fieldValues.nodes.find(
        value => value.field?.name === 'Status'
      );
      const status = statusNode?.name?.toLowerCase() || 'todo';

      const displayStatus = STATUS_MAPPING[status] || STATUS_MAPPING.default;

      if (!statusMap.has(displayStatus)) {
        statusMap.set(displayStatus, []);
      }
      statusMap.get(displayStatus).push(item);
    });

    // Display items by status
    console.log('\n📋 Project Board Status\n');
    for (const [status, items] of statusMap) {
      console.log(`\n${status} (${items.length} items):`);
      console.log('-'.repeat(40));
      
      items.forEach(item => {
        const issue = item.content;
        const agentLabels = issue.labels.nodes
          .filter(label => label.name.startsWith('agent:'))
          .map(label => `🐎 ${label.name.replace('agent:', '')}`)
          .join(', ');
        
        const otherLabels = issue.labels.nodes
          .filter(label => !label.name.startsWith('agent:'))
          .map(label => label.name)
          .join(', ');

        console.log(`\n#${issue.number}: ${issue.title}`);
        if (agentLabels) console.log(`Horses: ${agentLabels}`);
        if (otherLabels) console.log(`Labels: ${otherLabels}`);
        console.log(`URL: ${issue.url}`);
      });
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response?.data?.message) {
      console.error(error.response.data.message);
    }
    if (error.response?.errors) {
      console.error('GraphQL Errors:', JSON.stringify(error.response.errors, null, 2));
    }
    process.exit(1);
  }
}

viewProject().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});