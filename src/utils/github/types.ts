// Base types and interfaces
export interface GitHubClientConfig {
    token: string;
    owner: string;
    repo: string;
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

export interface Project {
    id: string;
    number: number;
    title: string;
    url: string;
    closed: boolean;
}

export interface ProjectField {
    id: string;
    name: string;
    dataType: string;
    options?: Array<{
        id: string;
        name: string;
    }>;
}

export interface Issue {
    id: string;
    number: number;
    title: string;
    body: string;
    url: string;
    state: string;
    labels: {
        nodes: Array<{
            id: string;
            name: string;
            color: string;
        }>;
    };
    comments: {
        nodes: Comment[];
    };
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
            nodes: Array<{
                id: string;
                name: string;
                color: string;
            }>;
        };
    } | null;
    fieldValues: {
        nodes: Array<{
            name: string;
            field: {
                name: string;
            };
        }>;
    };
}

export interface BoardCard {
    projectId: string;
    contentId: string;
    title: string;
    number: number;
    labels: {
        nodes: Array<{
            id: string;
            name: string;
            color: string;
        }>;
    };
    content: {
        url: string;
    };
}

export interface BoardColumn {
    id: string;
    title: string;
    cards: BoardCard[];
}

export interface Board {
    columns: BoardColumn[];
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

// Input types
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
    prNumber: number;
    mergeMethod?: 'MERGE' | 'SQUASH' | 'REBASE';
    commitHeadline: string;
    commitBody?: string;
}

export interface AddLabelsInput {
    labelableId: string;
    labelIds: string[];
}

export interface AddToProjectInput {
    projectId: string;
    contentId: string;
}

// Response types
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
            node: {
                id: string;
                body: string;
                author: {
                    login: string;
                };
                createdAt: string;
            };
        };
    };
}

export interface MergePullRequestResult {
    sha: string;
    merged: boolean;
    message: string;
}

export interface AddToProjectResult {
    addProjectV2ItemById: {
        item: {
            id: string;
        };
    };
}

export interface ListProjectsResult {
    organization: {
        projectsV2: {
            nodes: Project[];
            pageInfo: {
                hasNextPage: boolean;
                endCursor: string;
            };
        };
    };
}

export interface GetProjectFieldsResult {
    node: {
        fields: {
            nodes: ProjectField[];
        };
    };
}

export interface GetBoardDataResult {
    organization: {
        projectV2: {
            items: {
                nodes: Array<{
                    id: string;
                    fieldValues: {
                        nodes: Array<{
                            name: string;
                            field: {
                                name: string;
                            };
                        }>;
                    };
                    content: {
                        __typename: string;
                        id: string;
                        title: string;
                        number: number;
                        url: string;
                        labels: {
                            nodes: Array<{
                                id: string;
                                name: string;
                                color: string;
                            }>;
                        };
                    } | null;
                }>;
            };
        };
    };
}

// Error types
export interface GitHubErrorDetails {
    message?: string;
    type?: string;
    path?: string[];
}

export interface GitHubError extends Error {
    response?: {
        status?: number;
        data?: {
            message?: string;
        };
        errors?: GitHubErrorDetails[];
    };
}

// Client interface
export interface GitHubClient {
    getBoardData(projectNumber: number): Promise<Board>;
    listProjects(first?: number): Promise<Project[]>;
    getProjectFields(projectId: string): Promise<ProjectField[]>;
    getProjectMetadata(projectNumber: number): Promise<ProjectMetadata>;
    getOrCreateLabel(name: string, color?: string): Promise<string>;
    addLabels(labelableId: string, labelIds: string[]): Promise<AddLabelsResult>;
    createIssue(input: CreateIssueInput): Promise<CreateIssueResult>;
    createPullRequest(input: CreatePullRequestInput): Promise<CreatePullRequestResult>;
    updateItemStatus(input: UpdateProjectItemInput): Promise<UpdateItemStatusResult>;
    findProjectItem(projectId: string, issueNumber: number): Promise<ProjectItem | null>;
    findIssue(issueNumber: number): Promise<Issue | null>;
    getPullRequest(prNumber: number): Promise<PullRequest>;
    addComment(input: AddCommentInput): Promise<AddCommentResult>;
    addIssueComment(issueNumber: number, body: string): Promise<void>;
    addIssueToProject(contentId: string, projectId: string): Promise<void>;
    mergePullRequest(input: MergePullRequestInput): Promise<MergePullRequestResult>;
    addLabelsToIssue(issueNumber: number, labels: string[]): Promise<void>;
    moveIssueToStatus(projectNumber: number, issueNumber: number, status: ProjectItemStatus): Promise<UpdateItemStatusResult>;
}
