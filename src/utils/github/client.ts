import { graphql } from '@octokit/graphql';
import { Octokit } from '@octokit/rest';
import type {
  ProjectMetadata,
  CreateIssueInput,
  CreateIssueResult,
  CreatePullRequestInput,
  CreatePullRequestResult,
  UpdateProjectItemInput,
  UpdateItemStatusResult,
  GitHubClientConfig,
  ProjectItem,
  ProjectItemStatus,
  PullRequest,
  AddCommentInput,
  AddCommentResult,
  MergePullRequestInput,
  MergePullRequestResult,
  GitHubError,
  AddLabelsResult
} from './types.js';

/**
 * GitHub GraphQL API client for managing issues, PRs, and project items
 */
export class GitHubClient {
  private graphqlWithAuth;
  private octokit;
  private config: GitHubClientConfig;

  constructor(config: GitHubClientConfig) {
    this.config = config;
    this.graphqlWithAuth = graphql.defaults({
      headers: {
        authorization: `token ${config.token}`,
      },
    });
    this.octokit = new Octokit({
      auth: config.token,
      timeZone: 'UTC',
    });
  }

  /**
   * Get project metadata including field and status option IDs
   */
  async getProjectMetadata(): Promise<ProjectMetadata> {
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

    const response = await this.graphqlWithAuth(query, {
      owner: this.config.owner,
      repo: this.config.repo,
      projectNumber: this.config.projectNumber
    });

    const statusField = (response as any).repository.projectV2.fields.nodes.find(
      (field: any) => field.name === 'Status'
    );

    if (!statusField) {
      throw new Error('Status field not found in project');
    }

    const getOptionId = (name: string): string => {
      const option = statusField.options.find(
        (opt: any) => opt.name.toLowerCase() === name.toLowerCase()
      );
      if (!option) {
        throw new Error(`Status option "${name}" not found`);
      }
      return option.id;
    };

    return {
      repositoryId: (response as any).repository.id,
      projectId: (response as any).repository.projectV2.id,
      statusFieldId: statusField.id,
      statusOptionIds: {
        todo: getOptionId('Todo'),
        inProgress: getOptionId('In Progress'),
        inReview: getOptionId('In Review'),
        done: getOptionId('Done'),
      },
    };
  }

  /**
   * Create or get a label
   */
  async getOrCreateLabel(name: string, color: string = 'f29513'): Promise<string> {
    // Get label's global ID using GraphQL
    const query = `
      query($owner: String!, $repo: String!, $name: String!) {
        repository(owner: $owner, name: $repo) {
          label(name: $name) {
            id
            name
            nodeId
          }
        }
      }
    `;

    try {
      const response = await this.graphqlWithAuth(query, {
        owner: this.config.owner,
        repo: this.config.repo,
        name
      });

      const label = (response as any).repository.label;
      if (label) {
        return label.nodeId;
      }

      // Create label if it doesn't exist
      const { data: newLabel } = await this.octokit.rest.issues.createLabel({
        owner: this.config.owner,
        repo: this.config.repo,
        name,
        color,
        description: 'Horse agent label'
      });

      // Get the new label's global ID
      const newResponse = await this.graphqlWithAuth(query, {
        owner: this.config.owner,
        repo: this.config.repo,
        name
      });

      return (newResponse as any).repository.label.nodeId;
    } catch (error) {
      console.error('Error getting/creating label:', error);
      throw error;
    }
  }

  /**
   * Add labels to an issue or PR
   */
  async addLabels(labelableId: string, labelIds: string[]): Promise<AddLabelsResult> {
    const mutation = `
      mutation($input: AddLabelsToLabelableInput!) {
        addLabelsToLabelable(input: $input) {
          labelable {
            labels {
              nodes {
                id
                name
              }
            }
          }
        }
      }
    `;

    return this.graphqlWithAuth(mutation, {
      input: {
        labelableId,
        labelIds
      }
    }) as Promise<AddLabelsResult>;
  }

  /**
   * Create a new issue
   */
  async createIssue(input: CreateIssueInput): Promise<CreateIssueResult> {
    const mutation = `
      mutation($input: CreateIssueInput!) {
        createIssue(input: $input) {
          issue {
            id
            number
            url
          }
        }
      }
    `;

    return this.graphqlWithAuth(mutation, { input }) as Promise<CreateIssueResult>;
  }

  /**
   * Create a new pull request
   */
  async createPullRequest(input: CreatePullRequestInput): Promise<CreatePullRequestResult> {
    const mutation = `
      mutation($input: CreatePullRequestInput!) {
        createPullRequest(input: $input) {
          pullRequest {
            id
            number
            url
          }
        }
      }
    `;

    return this.graphqlWithAuth(mutation, { input }) as Promise<CreatePullRequestResult>;
  }

  /**
   * Update a project item's status
   */
  async updateItemStatus(input: UpdateProjectItemInput): Promise<UpdateItemStatusResult> {
    const mutation = `
      mutation($input: UpdateProjectV2ItemFieldValueInput!) {
        updateProjectV2ItemFieldValue(input: $input) {
          projectV2Item {
            id
          }
        }
      }
    `;

    return this.graphqlWithAuth(mutation, { input }) as Promise<UpdateItemStatusResult>;
  }

  /**
   * Find a project item by issue number
   */
  async findProjectItem(issueNumber: number): Promise<ProjectItem | null> {
    const query = `
      query($org: String!, $number: Int!) {
        organization(login: $org) {
          projectV2(number: $number) {
            items(first: 100) {
              nodes {
                id
                content {
                  ... on Issue {
                    id
                    title
                    number
                    url
                    labels(first: 100) {
                      nodes {
                        id
                        name
                        color
                      }
                    }
                  }
                }
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
              }
            }
          }
        }
      }
    `;

    const response = await this.graphqlWithAuth(query, {
      org: this.config.owner,
      number: this.config.projectNumber
    });

    const items = (response as any).organization.projectV2.items.nodes;
    return items.find((item: ProjectItem) => item.content?.number === issueNumber) || null;
  }

  /**
   * Get a pull request by number
   */
  async getPullRequest(prNumber: number): Promise<PullRequest> {
    const query = `
      query($owner: String!, $repo: String!, $number: Int!) {
        repository(owner: $owner, name: $repo) {
          pullRequest(number: $number) {
            id
            number
            url
            title
            headRefName
            baseRefName
            headRefOid
            comments(first: 100) {
              nodes {
                id
                body
                author {
                  login
                }
                createdAt
              }
            }
          }
        }
      }
    `;

    const response = await this.graphqlWithAuth(query, {
      owner: this.config.owner,
      repo: this.config.repo,
      number: prNumber
    });

    return (response as any).repository.pullRequest;
  }

  /**
   * Add a comment to a pull request
   */
  async addComment(input: AddCommentInput): Promise<AddCommentResult> {
    const mutation = `
      mutation($input: AddCommentInput!) {
        addComment(input: $input) {
          commentEdge {
            node {
              id
              body
              author {
                login
              }
              createdAt
            }
          }
        }
      }
    `;

    return this.graphqlWithAuth(mutation, { input }) as Promise<AddCommentResult>;
  }

  /**
   * Merge a pull request
   */
  async mergePullRequest(input: MergePullRequestInput): Promise<MergePullRequestResult> {
    // First check if PR can be merged using GraphQL
    const pr = await this.getPullRequest(parseInt(input.pullRequestId, 10));
    console.log('PR Status:', JSON.stringify(pr, null, 2));

    // Use Octokit REST client for merging
    try {
      const result = await this.octokit.pulls.merge({
        owner: this.config.owner,
        repo: this.config.repo,
        pull_number: parseInt(input.pullRequestId, 10),
        merge_method: 'squash',
        commit_title: input.commitHeadline,
        commit_message: input.commitBody,
        sha: pr.headRefOid
      });

      console.log('Merge result:', JSON.stringify(result.data, null, 2));
      return result.data as MergePullRequestResult;
    } catch (error) {
      const gitHubError = error as GitHubError;
      console.error('Full error:', JSON.stringify(gitHubError, null, 2));
      
      const message = gitHubError.response?.data?.message || gitHubError.message;
      const errors = gitHubError.response?.errors?.map(e => e.message).join(', ');
      
      throw new Error(`Failed to merge PR: ${message}${errors ? ` (${errors})` : ''}`);
    }
  }

  /**
   * Move an issue to a new status
   */
  async moveIssueToStatus(issueNumber: number, status: ProjectItemStatus) {
    const metadata = await this.getProjectMetadata();
    const item = await this.findProjectItem(issueNumber);

    if (!item) {
      throw new Error(`Issue #${issueNumber} not found in project`);
    }

    const statusOptionId = metadata.statusOptionIds[status];
    if (!statusOptionId) {
      throw new Error(`Invalid status: ${status}`);
    }

    return this.updateItemStatus({
      projectId: metadata.projectId,
      itemId: item.id,
      fieldId: metadata.statusFieldId,
      value: {
        singleSelectOptionId: statusOptionId
      }
    });
  }
}