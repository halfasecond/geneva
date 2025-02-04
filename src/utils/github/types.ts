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
  baseRefName: string;
  headRefName: string;
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
  mergeMethod: 'MERGE' | 'SQUASH' | 'REBASE';
  commitHeadline: string;
  commitBody?: string;
}

export interface PullRequest {
  id: string;
  number: number;
  url: string;
  title: string;
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