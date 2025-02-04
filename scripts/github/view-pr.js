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
Usage: node view-pr.js <pr-number>

Arguments:
  pr-number     The PR number to view

Example:
  node view-pr.js 2
`);
  process.exit(1);
}

const [prNumber] = args;

async function viewPR() {
  try {
    // Initialize GitHub client
    const client = new GitHubClient({
      token: process.env.VITE_APP_GITHUB_TOKEN,
      owner: process.env.VITE_APP_GITHUB_REPO_OWNER,
      repo: process.env.VITE_APP_GITHUB_REPO_NAME,
      projectNumber: parseInt(process.env.VITE_APP_GITHUB_PROJECT_NUMBER, 10)
    });

    // Get PR details
    const query = `
      query($owner: String!, $repo: String!, $number: Int!) {
        repository(owner: $owner, name: $repo) {
          pullRequest(number: $number) {
            title
            body
            baseRefName
            headRefName
            commits(first: 100) {
              nodes {
                commit {
                  message
                  additions
                  deletions
                  changedFiles
                }
              }
            }
            files(first: 100) {
              nodes {
                path
                additions
                deletions
                patch
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
          }
        }
      }
    `;

    const response = await client.graphqlWithAuth(query, {
      owner: process.env.VITE_APP_GITHUB_REPO_OWNER,
      repo: process.env.VITE_APP_GITHUB_REPO_NAME,
      number: parseInt(prNumber, 10)
    });

    const pr = response.repository.pullRequest;

    // Display PR information
    console.log('\n🔍 Pull Request Details\n');
    console.log(`Title: ${pr.title}`);
    console.log(`Branch: ${pr.headRefName} → ${pr.baseRefName}\n`);
    console.log('Description:');
    console.log(pr.body);
    console.log('\n📊 Changes Summary');
    
    // Calculate total changes
    const totalChanges = pr.commits.nodes.reduce((acc, node) => ({
      additions: acc.additions + node.commit.additions,
      deletions: acc.deletions + node.commit.deletions,
      files: acc.files + node.commit.changedFiles
    }), { additions: 0, deletions: 0, files: 0 });

    console.log(`Files Changed: ${totalChanges.files}`);
    console.log(`Additions: ${totalChanges.additions}`);
    console.log(`Deletions: ${totalChanges.deletions}\n`);

    // Display file changes
    console.log('📝 Changed Files:');
    pr.files.nodes.forEach(file => {
      console.log(`\n${file.path} (+${file.additions}/-${file.deletions})`);
      if (file.patch) {
        console.log('```diff');
        console.log(file.patch);
        console.log('```');
      }
    });

    // Display comments
    if (pr.comments.nodes.length > 0) {
      console.log('\n💬 Comments:');
      pr.comments.nodes.forEach(comment => {
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

viewPR().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});