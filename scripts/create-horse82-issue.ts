import { createAgentIssue } from '../src/utils/createAgentIssue';
import { getProjectMetadata } from '../src/utils/getProjectMetadata';

async function createInitialIssue() {
  try {
    // First get the project metadata
    const metadata = await getProjectMetadata(
      process.env.VITE_APP_GITHUB_REPO_OWNER!,
      process.env.VITE_APP_GITHUB_REPO_NAME!,
      parseInt(process.env.VITE_APP_GITHUB_PROJECT_NUMBER!, 10)
    );

    // Create the issue
    const result = await createAgentIssue(
      "Implement Tilled Fields Board",
      `As Horse #82, I am implementing a GitHub Projects integration with a farming theme.

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
      metadata.projectId
    );

    if (result.success) {
      console.log(`Issue created successfully! Issue #${result.issueNumber}`);
    } else {
      console.error('Failed to create issue:', result.error);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

createInitialIssue();