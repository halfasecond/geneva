import { graphql } from '@octokit/graphql';

const graphqlWithAuth = graphql.defaults({
  headers: {
    authorization: `token ${import.meta.env.VITE_APP_GITHUB_TOKEN}`,
  },
});

interface CreateIssueResponse {
  createIssue: {
    issue: {
      id: string;
      number: number;
    };
  };
}

interface AddToProjectResponse {
  addProjectV2ItemById: {
    item: {
      id: string;
    };
  };
}

export async function createAgentIssue(
  title: string,
  body: string,
  projectId: string
) {
  try {
    // First, create the issue
    const createIssueMutation = `
      mutation($repositoryId: ID!, $title: String!, $body: String!) {
        createIssue(input: {
          repositoryId: $repositoryId,
          title: $title,
          body: $body,
          labelIds: ["agent:horse82"]
        }) {
          issue {
            id
            number
          }
        }
      }
    `;

    const issueResult = await graphqlWithAuth<CreateIssueResponse>(createIssueMutation, {
      repositoryId: import.meta.env.VITE_APP_GITHUB_REPO_ID,
      title,
      body: `Created by Horse #82 🐎\n\n${body}`,
    });

    // Then add it to the project
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

    const projectResult = await graphqlWithAuth<AddToProjectResponse>(addToProjectMutation, {
      projectId,
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
      projectId,
      itemId: projectResult.addProjectV2ItemById.item.id,
      fieldId: import.meta.env.VITE_APP_GITHUB_PROJECT_STATUS_FIELD_ID,
      optionId: import.meta.env.VITE_APP_GITHUB_PROJECT_IN_PROGRESS_OPTION_ID,
    });

    return {
      success: true,
      issueNumber: issueResult.createIssue.issue.number,
    };
  } catch (error) {
    console.error('Error creating agent issue:', error);
    return {
      success: false,
      error,
    };
  }
}

// Example usage:
/*
await createAgentIssue(
  "Implement Tilled Fields Board",
  `As Horse #82, I am implementing a GitHub Projects integration with a farming theme.

Tasks:
- [x] Set up project board
- [x] Create tilled field visualization
- [x] Add agent label support
- [ ] Add real-time updates
- [ ] Implement drag-and-drop

This implementation will provide a farming-themed visualization of our project tasks, with special support for AI agent contributions.`,
  "your-project-id"
);
*/