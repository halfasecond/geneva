import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { GitHubClient } from '../../src/utils/github/client.js';
import { ProjectItemStatus } from '../../src/utils/github/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: resolve(__dirname, '../../.env') });

async function main() {
    const issueNumber = parseInt(process.argv[2], 10);
    const status = process.argv[3]?.toLowerCase();

    if (!issueNumber || !status) {
        console.error('Usage: yarn github:status <issue-number> <status>');
        console.error('Status must be one of: todo, inProgress, inReview, done');
        process.exit(1);
    }

    // Validate status
    const validStatuses = ['todo', 'inprogress', 'inreview', 'done'];
    if (!validStatuses.includes(status)) {
        console.error('Invalid status. Must be one of:', validStatuses.join(', '));
        process.exit(1);
    }

    // Map input status to enum
    const statusMap: Record<string, ProjectItemStatus> = {
        'todo': ProjectItemStatus.TODO,
        'inprogress': ProjectItemStatus.IN_PROGRESS,
        'inreview': ProjectItemStatus.IN_REVIEW,
        'done': ProjectItemStatus.DONE
    };

    const client = new GitHubClient({
        token: process.env.GITHUB_TOKEN!,
        owner: process.env.GITHUB_OWNER!,
        repo: process.env.GITHUB_REPO!
    });

    try {
        await client.moveIssueToStatus(1, issueNumber, statusMap[status]); // Default to project #1 (Paddock)
        console.log(`✅ Updated issue #${issueNumber} status to ${status}`);
    } catch (error) {
        console.error('❌ Failed to update issue status:', error);
        process.exit(1);
    }
}

main().catch(console.error);