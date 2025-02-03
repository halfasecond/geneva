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

async function createIssue() {
  try {
    console.log('\n🐎 Creating issue as Horse #82...\n');

    // Get the label ID first
    const getLabelQuery = `
      query($owner: String!, $repo: String!, $labelName: String!) {
        repository(owner: $owner, name: $repo) {
          label(name: $labelName) {
            id
          }
        }
      }
    `;

    const labelResult = await graphqlWithAuth(getLabelQuery, {
      owner: process.env.VITE_APP_GITHUB_REPO_OWNER,
      repo: process.env.VITE_APP_GITHUB_REPO_NAME,
      labelName: 'agent:horse82'
    });

    if (!labelResult.repository.label) {
      throw new Error('Label agent:horse82 not found. Please run yarn setup-agent-label first.');
    }

    // Create the issue with the label
    const createIssueMutation = `
      mutation($repositoryId: ID!, $title: String!, $body: String!, $labelIds: [ID!]) {
        createIssue(input: {
          repositoryId: $repositoryId,
          title: $title,
          body: $body,
          labelIds: $labelIds
        }) {
          issue {
            id
            number
          }
        }
      }
    `;

    const issueResult = await graphqlWithAuth(createIssueMutation, {
      repositoryId: process.env.VITE_APP_GITHUB_REPO_ID,
      title: "Implement Tilled Fields Board",
      body: `As Horse #82, I am implementing a GitHub Projects integration with a farming theme.

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
- Add more agent-specific features

~ Horse #82 🐎`,
      labelIds: [labelResult.repository.label.id]
    });

    // Add it to the project
    const addToProjectMutation = `
      mutation($projectId: ID!, $contentId: ID!) {
        addProjectV2ItemById(input: {
          projectId: $projectId,
          contentId: $contentId
        }) {
          item {
            id
          }
        }
      }
    `;

    const projectResult = await graphqlWithAuth(addToProjectMutation, {
      projectId: process.env.VITE_APP_GITHUB_PROJECT_ID,
      contentId: issueResult.createIssue.issue.id,
    });

    // Set the status to "In Progress"
    const updateStatusMutation = `
      mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
        updateProjectV2ItemFieldValue(input: {
          projectId: $projectId,
          itemId: $itemId,
          fieldId: $fieldId,
          value: { 
            singleSelectOptionId: $optionId
          }
        }) {
          projectV2Item {
            id
          }
        }
      }
    `;

    await graphqlWithAuth(updateStatusMutation, {
      projectId: process.env.VITE_APP_GITHUB_PROJECT_ID,
      itemId: projectResult.addProjectV2ItemById.item.id,
      fieldId: process.env.VITE_APP_GITHUB_PROJECT_STATUS_FIELD_ID,
      optionId: process.env.VITE_APP_GITHUB_PROJECT_IN_PROGRESS_OPTION_ID,
    });

    console.log(`✨ Created issue #${issueResult.createIssue.issue.number}`);
    console.log('🌾 Added to project board in "Growing Field"\n');

  } catch (error) {
    console.error('\n❌ Error creating issue:');
    if (error.message) {
      console.error(error.message);
    }
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