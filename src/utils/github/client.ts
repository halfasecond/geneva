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
    AddLabelsResult,
    Project,
    ListProjectsResult,
    ProjectField,
    GetProjectFieldsResult,
    GetBoardDataResult,
    Board,
    BoardCard
} from './types';

/**
 * GitHub GraphQL API client for managing issues, PRs, and project items
 */
export class GitHubClient {
    private graphqlWithAuth;
    private octokit;
    private config: GitHubClientConfig;
    private projectMetadataCache: Map<number, ProjectMetadata> = new Map();

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
     * Get board data for a project
     */
    async getBoardData(projectNumber: number): Promise<Board> {
        const query = `
            query($org: String!, $number: Int!) {
                organization(login: $org) {
                    projectV2(number: $number) {
                        items(first: 100) {
                            nodes {
                                id
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
                                content {
                                    __typename
                                    ... on Issue {
                                        id
                                        title
                                        number
                                        url
                                        labels(first: 10) {
                                            nodes {
                                                id
                                                name
                                                color
                                            }
                                        }
                                    }
                                    ... on PullRequest {
                                        id
                                        title
                                        number
                                        url
                                        labels(first: 10) {
                                            nodes {
                                                id
                                                name
                                                color
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
            number: projectNumber
        }) as GetBoardDataResult;

        const board: Board = {
            columns: [
                {
                    id: 'Todo',
                    title: 'Backlog Field 🌱',
                    cards: []
                },
                {
                    id: 'In Progress',
                    title: 'Growing Field 🌾',
                    cards: []
                },
                {
                    id: 'In Review',
                    title: 'Review Field 🌿',
                    cards: []
                },
                {
                    id: 'Done',
                    title: 'Harvested Field 🌾',
                    cards: []
                }
            ]
        };

        const processedKeys = new Set<string>();
        const items = response.organization.projectV2.items.nodes;

        items.forEach(item => {
            if (!item.content || !['Issue', 'PullRequest'].includes(item.content.__typename)) {
                return;
            }

            const itemKey = `${item.id}-${item.content.id}`;
            if (processedKeys.has(itemKey)) {
                return;
            }
            processedKeys.add(itemKey);

            const statusNode = item.fieldValues.nodes.find(
                value => value?.field?.name === 'Status'
            );
            const status = statusNode?.name || 'Todo';

            const card: BoardCard = {
                projectId: item.id,
                contentId: item.content.id,
                title: item.content.title,
                number: item.content.number,
                labels: item.content.labels,
                content: {
                    url: item.content.url
                }
            };

            // Add to appropriate column
            let columnIndex = 0;
            if (status === 'In Progress') columnIndex = 1;
            else if (status === 'In Review') columnIndex = 2;
            else if (status === 'Done') columnIndex = 3;

            board.columns[columnIndex].cards.push(card);
        });

        return board;
    }

    /**
     * List all projects for the organization
     */
    async listProjects(first: number = 20): Promise<Project[]> {
        const query = `
            query($owner: String!, $first: Int!) {
                organization(login: $owner) {
                    projectsV2(first: $first) {
                        nodes {
                            id
                            number
                            title
                            url
                            closed
                        }
                    }
                }
            }
        `;

        const response = await this.graphqlWithAuth(query, {
            owner: this.config.owner,
            first
        }) as ListProjectsResult;

        return response.organization.projectsV2.nodes;
    }

    /**
     * Get project fields including status options
     */
    async getProjectFields(projectId: string): Promise<ProjectField[]> {
        const query = `
            query($projectId: ID!) {
                node(id: $projectId) {
                    ... on ProjectV2 {
                        fields(first: 20) {
                            nodes {
                                ... on ProjectV2Field {
                                    id
                                    name
                                    dataType
                                }
                                ... on ProjectV2SingleSelectField {
                                    id
                                    name
                                    dataType
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
            projectId
        }) as GetProjectFieldsResult;

        return response.node.fields.nodes;
    }

    /**
     * Get project metadata including field and status option IDs
     */
    async getProjectMetadata(projectNumber: number): Promise<ProjectMetadata> {
        // Check cache first
        const cached = this.projectMetadataCache.get(projectNumber);
        if (cached) {
            return cached;
        }

        const query = `
            query($owner: String!, $repo: String!, $projectNumber: Int!) {
                repository(owner: $owner, name: $repo) {
                    id
                    projectV2(number: $projectNumber) {
                        id
                        field(name: "Status") {
                            ... on ProjectV2SingleSelectField {
                                id
                                options {
                                    id
                                    name
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
            projectNumber
        });

        const statusField = (response as any).repository.projectV2.field;
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

        const metadata: ProjectMetadata = {
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

        // Cache the metadata
        this.projectMetadataCache.set(projectNumber, metadata);

        return metadata;
    }

    /**
     * Create or get a label
     */
    async getOrCreateLabel(name: string, color: string = 'f29513'): Promise<string> {
        const query = `
            query($owner: String!, $repo: String!, $name: String!) {
                repository(owner: $owner, name: $repo) {
                    label(name: $name) {
                        id
                        name
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
                return label.id;
            }

            await this.octokit.rest.issues.createLabel({
                owner: this.config.owner,
                repo: this.config.repo,
                name,
                color,
                description: 'Agent label'
            });

            const newResponse = await this.graphqlWithAuth(query, {
                owner: this.config.owner,
                repo: this.config.repo,
                name
            });

            return (newResponse as any).repository.label.id;
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
    async findProjectItem(projectId: string, issueNumber: number): Promise<ProjectItem | null> {
        const query = `
            query($projectId: ID!, $first: Int!) {
                node(id: $projectId) {
                    ... on ProjectV2 {
                        items(first: $first) {
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
            projectId,
            first: 100
        });

        const items = (response as any).node.items.nodes;
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
     * Add a comment to a pull request or issue
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
     * Add a comment to an issue
     */
    async addIssueComment(issueNumber: number, body: string): Promise<void> {
        await this.octokit.rest.issues.createComment({
            owner: this.config.owner,
            repo: this.config.repo,
            issue_number: issueNumber,
            body
        });
    }

    /**
     * Add an issue to a project
     */
    async addIssueToProject(contentId: string, projectId: string): Promise<void> {
        const mutation = `
            mutation($input: AddProjectV2ItemByIdInput!) {
                addProjectV2ItemById(input: $input) {
                    item {
                        id
                    }
                }
            }
        `;

        await this.graphqlWithAuth(mutation, {
            input: {
                projectId,
                contentId
            }
        });
    }

    /**
     * Merge a pull request
     */
    async mergePullRequest(input: MergePullRequestInput): Promise<MergePullRequestResult> {
        const pr = await this.getPullRequest(input.prNumber);

        try {
            const result = await this.octokit.pulls.merge({
                owner: this.config.owner,
                repo: this.config.repo,
                pull_number: input.prNumber,
                merge_method: 'squash',
                commit_title: input.commitHeadline,
                commit_message: input.commitBody,
                sha: pr.headRefOid
            });

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
     * Add labels to an issue using REST API
     */
    async addLabelsToIssue(issueNumber: number, labels: string[]) {
        await this.octokit.rest.issues.addLabels({
            owner: this.config.owner,
            repo: this.config.repo,
            issue_number: issueNumber,
            labels
        });
    }

    /**
     * Move an issue to a new status in a project
     */
    async moveIssueToStatus(projectNumber: number, issueNumber: number, status: ProjectItemStatus) {
        const metadata = await this.getProjectMetadata(projectNumber);
        const item = await this.findProjectItem(metadata.projectId, issueNumber);

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
