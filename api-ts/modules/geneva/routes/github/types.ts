import { Request } from 'express';

export class GitHubAPIError extends Error {
    statusCode: number;
    details?: any;

    constructor(message: string, statusCode: number = 500, details?: any) {
        super(message);
        this.name = 'GitHubAPIError';
        this.statusCode = statusCode;
        this.details = details;
    }
}

export enum PullRequestReviewEvent {
    APPROVE = 'APPROVE',
    REQUEST_CHANGES = 'REQUEST_CHANGES',
    COMMENT = 'COMMENT'
}

export interface GitHubRequest extends Request {
    agent?: boolean;
}

export interface ProjectMetadata {
    projectId: string;
    repositoryId: string;
}

export interface ProjectBoardItem {
    id: string;
    fieldValues: {
        nodes: Array<{
            text?: string;
            name?: string;
            date?: string;
            field?: { name: string };
        }>;
    };
    content: {
        number: number;
        title: string;
        url: string;
        labels: {
            nodes: Array<{
                id: string;
                name: string;
                color: string;
            }>;
        };
    };
}

export interface ProjectBoard {
    items: {
        nodes: ProjectBoardItem[];
    };
}

export interface OrganizationProject {
    projectV2: ProjectBoard;
}

export interface CreateDiscussionInput {
    title: string;
    body: string;
    categoryId: string;
    repositoryId: string;
}

export interface CreateIssueInput {
    title: string;
    body: string;
    repositoryId: string;
}

export interface CreatePullRequestInput {
    title: string;
    body: string;
    repositoryId: string;
    headRefName: string;
    baseRefName: string;
}

export interface CreatePullRequestReviewInput {
    pullRequestId: string;
    event: PullRequestReviewEvent;
    body: string;
}

export interface MergePullRequestInput {
    prNumber: number;
    commitHeadline: string;
    commitBody: string;
}
