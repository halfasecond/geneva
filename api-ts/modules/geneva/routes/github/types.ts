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
