import { GitHubClient } from '../../src/utils/github/client';

async function main() {
    const issueNumber = parseInt(process.argv[2], 10);
    const projectNumber = parseInt(process.argv[3], 10);

    if (!issueNumber || !projectNumber) {
        console.error('Usage: yarn add-to-project <issue-number> <project-number>');
        process.exit(1);
    }

    const client = new GitHubClient({
        token: process.env.GITHUB_TOKEN!,
        owner: process.env.GITHUB_OWNER!,
        repo: process.env.GITHUB_REPO!
    });

    try {
        // Get project metadata
        const metadata = await client.getProjectMetadata(projectNumber);
        
        // Find the issue in the project
        const item = await client.findProjectItem(metadata.projectId, issueNumber);

        if (!item?.content?.id) {
            throw new Error(`Issue #${issueNumber} not found`);
        }

        // Add issue to project
        await client.addIssueToProject(item.content.id, metadata.projectId);
        
        console.log(`✅ Added issue #${issueNumber} to project #${projectNumber}`);
    } catch (error) {
        console.error('❌ Failed to add issue to project:', error);
        process.exit(1);
    }
}

main().catch(console.error);
