/**
 * Types for GitHub API integration
 */

export interface ProjectV2ItemFieldValue {
  name: string;
  field: {
    name: string;
  };
}

export interface CardLabel {
  id: string;
  name: string;
  color: string;
}

export interface ProjectItem {
  id: string;
  content: {
    __typename: string;
    id: string;
    title: string;
    number: number;
    url: string;
    labels: {
      nodes: CardLabel[];
    };
  } | null;
  fieldValues: {
    nodes: ProjectV2ItemFieldValue[];
  };
}

export interface ProjectMetadata {
  repositoryId: string;
  projectId: string;
  statusFieldId: string;
  statusOptionIds: {
    todo: string;
    inProgress: string;
    inReview: string;
    done: string;
  };
}

export interface CreateIssueInput {
  title: string;
  body: string;
  repositoryId: string;
  labelIds?: string[];
}

export interface CreatePullRequestInput {
  title: string;
  body: string;
  repositoryId: string;
  headRefName: string;
  baseRefName: string;
}

export interface UpdateProjectItemInput {
  projectId: string;
  itemId: string;
  fieldId: string;
  value: {
    singleSelectOptionId: string;
  };
}

export interface AddCommentInput {
  subjectId: string;
  body: string;
}

export interface MergePullRequestInput {
  pullRequestId: string;
  mergeMethod?: 'MERGE' | 'SQUASH' | 'REBASE';
  commitHeadline: string;
  commitBody?: string;
}

export interface PullRequest {
  id: string;
  number: number;
  url: string;
  title: string;
  headRefName: string;
  baseRefName: string;
  headRefOid: string;
  comments: {
    nodes: Comment[];
  };
}

export interface Comment {
  id: string;
  body: string;
  author: {
    login: string;
  };
  createdAt: string;
}

export enum ProjectItemStatus {
  TODO = 'todo',
  IN_PROGRESS = 'inProgress',
  IN_REVIEW = 'inReview',
  DONE = 'done'
}

export interface GitHubClientConfig {
  token: string;
  owner: string;
  repo: string;
  projectNumber: number;
}

export interface GitHubError extends Error {
  response?: {
    data?: {
      message?: string;
    };
    errors?: Array<{
      message: string;
      type: string;
      path: string[];
    }>;
  };
}

export interface CreateIssueResult {
  createIssue: {
    issue: {
      id: string;
      number: number;
      url: string;
    };
  };
}

export interface CreatePullRequestResult {
  createPullRequest: {
    pullRequest: {
      id: string;
      number: number;
      url: string;
    };
  };
}

export interface AddLabelsResult {
  addLabelsToLabelable: {
    labelable: {
      labels: {
        nodes: Array<{
          id: string;
          name: string;
        }>;
      };
    };
  };
}

export interface UpdateItemStatusResult {
  updateProjectV2ItemFieldValue: {
    projectV2Item: {
      id: string;
    };
  };
}

export interface AddCommentResult {
  addComment: {
    commentEdge: {
      node: Comment;
    };
  };
}

export interface MergePullRequestResult {
  sha: string;
  merged: boolean;
  message: string;
}

export interface AddLabelsInput {
  labelableId: string;
  labelIds: string[];
}