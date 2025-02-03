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

async function setupAgentLabel() {
  try {
    console.log('\n🐎 Setting up Horse #82 label...\n');

    const createLabelMutation = `
      mutation($input: CreateLabelInput!) {
        createLabel(input: $input) {
          label {
            id
            name
            color
          }
        }
      }
    `;

    const result = await graphqlWithAuth(createLabelMutation, {
      input: {
        repositoryId: process.env.VITE_APP_GITHUB_REPO_ID,
        name: 'agent:horse82',
        color: '8B4513',
        description: 'Tasks and contributions from Horse #82'
      }
    });

    console.log('✨ Created label:', result.createLabel.label);
    console.log('\n🌾 Label is ready for use in issue creation\n');

  } catch (error) {
    if (error.message?.includes('already exists')) {
      console.log('✨ Label agent:horse82 already exists\n');
    } else {
      console.error('\n❌ Error creating label:');
      if (error.message) {
        console.error(error.message);
      }
      process.exit(1);
    }
  }
}

setupAgentLabel().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});