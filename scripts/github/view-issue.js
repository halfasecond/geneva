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

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error(`
Usage: node view-issue.js <issue-number>

Arguments:
  issue-number   The issue number to view

Example:
  node view-issue.js 23
`);
  process.exit(1);
}

const [issueNumber] = args;

async function viewIssue() {
  try {
    // Initialize GitHub client
    const client = new GitHubClient({
      token: process.env.VITE_APP_GITHUB_TOKEN,
      owner: process.env.VITE_APP_GITHUB_REPO_OWNER,
      repo: process.env.VITE_APP_GITHUB_REPO_NAME,
      projectNumber: parseInt(process.env.VITE_APP_GITHUB_PROJECT_NUMBER, 10)
    });

    // Get issue details
    const query = `
      query($owner: String!, $repo: String!, $number: Int!) {
        repository(owner: $owner, name: $repo) {
          issue(number: $number) {
            title
            body
            state
            createdAt
            author {
              login
            }
            labels(first: 100) {
              nodes {
                name
                color
              }
            }
            comments(first: 100) {
              nodes {
                author {
                  login
                }
                body
                createdAt
              }
            }
            projectItems(first: 100) {
              nodes {
                project {
                  title
                }
                fieldValues(first: 100) {
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
              }
            }
          }
        }
      }
    `;

    const response = await client.graphqlWithAuth(query, {
      owner: process.env.VITE_APP_GITHUB_REPO_OWNER,
      repo: process.env.VITE_APP_GITHUB_REPO_NAME,
      number: parseInt(issueNumber, 10)
    });

    const issue = response.repository.issue;

    // Display issue information
    console.log('\n🔍 Issue Details\n');
    console.log(`Title: ${issue.title}`);
    console.log(`State: ${issue.state}`);
    console.log(`Created: ${new Date(issue.createdAt).toLocaleString()}`);
    console.log(`Author: ${issue.author.login}\n`);

    // Display labels
    if (issue.labels.nodes.length > 0) {
      console.log('🏷️  Labels:');
      issue.labels.nodes.forEach(label => {
        console.log(`- ${label.name}`);
      });
      console.log();
    }

    // Display project status
    if (issue.projectItems.nodes.length > 0) {
      console.log('📋 Project Status:');
      issue.projectItems.nodes.forEach(item => {
        console.log(`Project: ${item.project.title}`);
        const status = item.fieldValues.nodes.find(
          value => value.field?.name === 'Status'
        );
        if (status) {
          console.log(`Status: ${status.name}`);
        }
      });
      console.log();
    }

    // Display description
    console.log('📝 Description:');
    console.log(issue.body);

    // Display comments
    if (issue.comments.nodes.length > 0) {
      console.log('\n💬 Comments:');
      issue.comments.nodes.forEach(comment => {
        const date = new Date(comment.createdAt).toLocaleString();
        console.log(`\n${comment.author.login} (${date}):`);
        console.log(comment.body);
      });
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response?.data?.message) {
      console.error(error.response.data.message);
    }
    process.exit(1);
  }
}

viewIssue().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
