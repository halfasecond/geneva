import { ProjectItemStatus } from '../../utils/github/types';

// API Request Types
export interface CreateIssueRequest {
    agent: string;
    type: 'feat' | 'fix' | 'docs' | 'refactor';
    description: string;
    body: string;
    projectNumber?: number;
}

export interface AddLabelsRequest {
    agent: string;
    issueNumber: number;
    labels: string[];
}

export interface UpdateStatusRequest {
    agent: string;
    issueNumber: number;
    projectNumber: number;
    status: ProjectItemStatus;
}

export interface CreatePullRequestRequest {
    agent: string;
    type: 'feat' | 'fix' | 'docs' | 'refactor';
    description: string;
    issueNumber: number;
    headBranch: string;
    baseBranch: string;
    body: string;
    projectNumber: number;
}

export interface AddCommentRequest {
    agent: string;
    issueNumber: number;
    body: string;
}

export interface MergePullRequestRequest {
    agent: string;
    prNumber: number;
    commitHeadline: string;
    commitBody: string;
}

// API Response Types
export interface ErrorResponse {
    message: string;
    details?: any;
}

export interface APISuccessResponse<T> {
    success: true;
    data: T;
    error?: never;
}

export interface APIErrorResponse {
    success: false;
    data?: never;
    error: ErrorResponse;
}

export type APIResponse<T = any> = APISuccessResponse<T> | APIErrorResponse;

// Error Types
export class GitHubAPIError extends Error {
    constructor(
        message: string,
        public statusCode: number = 500,
        public details?: any
    ) {
        super(message);
        this.name = 'GitHubAPIError';
    }
}