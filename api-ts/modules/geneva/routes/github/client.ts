import { GitHubAPIError, ProjectMetadata, CreateDiscussionInput, CreateIssueInput, CreatePullRequestInput, CreatePullRequestReviewInput, MergePullRequestInput } from './types.js';
import dotenv from 'dotenv';
dotenv.config();

const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO } = process.env

if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    throw new Error('Missing required GitHub environment variables');
}

export class GitHubClient {
    private endpoint = 'https://api.github.com/graphql';
    private headers = {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
    };

    private async graphql(query: string, variables: any = {}) {
        const response = await fetch(this.endpoint, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify({ query, variables })
        });

        if (!response.ok) {
            throw new GitHubAPIError('GitHub API request failed', response.status);
        }

        const data = await response.json();
        if (data.errors) {
            throw new GitHubAPIError(data.errors[0].message, 400, data.errors);
        }

        return data.data;
    }

    async listIssues() {
        const query = `
            query {
                repository(owner: "${GITHUB_OWNER}", name: "${GITHUB_REPO}") {
                    issues(first: 100, orderBy: {field: CREATED_AT, direction: DESC}) {
                        nodes {
                            number
                            title
                            body
                            state
                            createdAt
                            labels(first: 10) {
                                nodes {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `;
        const result = await this.graphql(query);
        return result.repository.issues.nodes;
    }

    async findIssue(issueNumber: number) {
        const query = `
            query {
                repository(owner: "${GITHUB_OWNER}", name: "${GITHUB_REPO}") {
                    issue(number: ${issueNumber}) {
                        number
                        title
                        body
                        state
                        createdAt
                        labels(first: 10) {
                            nodes {
                                name
                            }
                        }
                    }
                }
            }
        `;
        const result = await this.graphql(query);
        return result.repository.issue;
    }

    async getPullRequest(prNumber: number) {
        const query = `
            query {
                repository(owner: "${GITHUB_OWNER}", name: "${GITHUB_REPO}") {
                    pullRequest(number: ${prNumber}) {
                        id
                        number
                        title
                        body
                        state
                        createdAt
                        reviews(first: 10) {
                            nodes {
                                author {
                                    login
                                }
                                state
                                body
                            }
                        }
                    }
                }
            }
        `;
        const result = await this.graphql(query);
        return result.repository.pullRequest;
    }

    async listProjects() {
        const query = `
            query {
                repository(owner: "${GITHUB_OWNER}", name: "${GITHUB_REPO}") {
                    projectsV2(first: 20) {
                        nodes {
                            number
                            title
                        }
                    }
                }
            }
        `;
        const result = await this.graphql(query);
        return result.repository.projectsV2.nodes;
    }

    async getProjectMetadata(projectNumber: number): Promise<ProjectMetadata> {
        const query = `
            query {
                repository(owner: "${GITHUB_OWNER}", name: "${GITHUB_REPO}") {
                    id
                    projectV2(number: ${projectNumber}) {
                        id
                    }
                }
            }
        `;
        const result = await this.graphql(query);
        return {
            repositoryId: result.repository.id,
            projectId: result.repository.projectV2.id
        };
    }

    async getBoardData(projectNumber: number) {
        const query = `
            query {
                repository(owner: "${GITHUB_OWNER}", name: "${GITHUB_REPO}") {
                    projectV2(number: ${projectNumber}) {
                        items(first: 100) {
                            nodes {
                                id
                                fieldValues(first: 8) {
                                    nodes {
                                        ... on ProjectV2ItemFieldTextValue {
                                            text
                                            field { ... on ProjectV2FieldCommon { name } }
                                        }
                                        ... on ProjectV2ItemFieldDateValue {
                                            date
                                            field { ... on ProjectV2FieldCommon { name } }
                                        }
                                        ... on ProjectV2ItemFieldSingleSelectValue {
                                            name
                                            field { ... on ProjectV2FieldCommon { name } }
                                        }
                                    }
                                }
                                content {
                                    ... on Issue {
                                        number
                                        title
                                        labels(first: 10) {
                                            nodes {
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
        `;
        const result = await this.graphql(query);
        return result.repository.projectV2;
    }

    async createDiscussion(input: CreateDiscussionInput) {
        const query = `
            mutation($input: CreateDiscussionInput!) {
                createDiscussion(input: $input) {
                    discussion {
                        id
                        number
                        title
                        body
                    }
                }
            }
        `;
        return this.graphql(query, { input });
    }

    async createIssue(input: CreateIssueInput) {
        const query = `
            mutation($input: CreateIssueInput!) {
                createIssue(input: $input) {
                    issue {
                        id
                        number
                    }
                }
            }
        `;
        return this.graphql(query, { input });
    }

    async createPullRequest(input: CreatePullRequestInput) {
        const query = `
            mutation($input: CreatePullRequestInput!) {
                createPullRequest(input: $input) {
                    pullRequest {
                        id
                        number
                    }
                }
            }
        `;
        return this.graphql(query, { input });
    }

    async createPullRequestReview(prNumber: number, input: CreatePullRequestReviewInput) {
        const query = `
            mutation($input: AddPullRequestReviewInput!) {
                addPullRequestReview(input: $input) {
                    pullRequestReview {
                        id
                    }
                }
            }
        `;
        return this.graphql(query, { input });
    }

    async mergePullRequest(input: MergePullRequestInput) {
        const query = `
            mutation($input: MergePullRequestInput!) {
                mergePullRequest(input: $input) {
                    pullRequest {
                        merged
                    }
                }
            }
        `;
        return this.graphql(query, { input });
    }

    async addIssueComment(issueNumber: number, body: string) {
        const query = `
            mutation {
                addComment(input: {
                    subjectId: "${issueNumber}",
                    body: "${body}"
                }) {
                    commentEdge {
                        node {
                            id
                        }
                    }
                }
            }
        `;
        return this.graphql(query);
    }

    async addLabelsToIssue(issueNumber: number, labels: string[]) {
        const query = `
            mutation {
                addLabelsToLabelable(input: {
                    labelableId: "${issueNumber}",
                    labelIds: ${JSON.stringify(labels)}
                }) {
                    labelable {
                        labels(first: 10) {
                            nodes {
                                name
                            }
                        }
                    }
                }
            }
        `;
        return this.graphql(query);
    }

    async addLabelsToPullRequest(prNumber: number, labels: string[]) {
        const query = `
            mutation {
                addLabelsToLabelable(input: {
                    labelableId: "${prNumber}",
                    labelIds: ${JSON.stringify(labels)}
                }) {
                    labelable {
                        ... on PullRequest {
                            labels(first: 10) {
                                nodes {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `;
        return this.graphql(query);
    }

    async addIssueToProject(issueId: string, projectId: string) {
        const query = `
            mutation {
                addProjectV2ItemById(input: {
                    projectId: "${projectId}",
                    contentId: "${issueId}"
                }) {
                    item {
                        id
                    }
                }
            }
        `;
        return this.graphql(query);
    }

    async moveIssueToStatus(projectNumber: number, issueNumber: number, status: string) {
        const metadata = await this.getProjectMetadata(projectNumber);
        const query = `
            mutation {
                updateProjectV2ItemFieldValue(input: {
                    projectId: "${metadata.projectId}",
                    itemId: "${issueNumber}",
                    fieldId: "Status",
                    value: { 
                        singleSelectOptionId: "${status}"
                    }
                }) {
                    projectV2Item {
                        id
                    }
                }
            }
        `;
        return this.graphql(query);
    }

    async findProjectItem(projectId: string, issueNumber: number) {
        const query = `
            query {
                node(id: "${projectId}") {
                    ... on ProjectV2 {
                        items(first: 100) {
                            nodes {
                                content {
                                    ... on Issue {
                                        id
                                        number
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;
        const result = await this.graphql(query);
        return result.node.items.nodes.find((item: any) => 
            item.content?.number === issueNumber
        );
    }

    async getProjectFields(projectId: string) {
        const query = `
            query {
                node(id: "${projectId}") {
                    ... on ProjectV2 {
                        fields(first: 20) {
                            nodes {
                                ... on ProjectV2Field {
                                    id
                                    name
                                }
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
        const result = await this.graphql(query);
        return result.node.fields.nodes;
    }

    async listDiscussionCategories() {
        const query = `
            query {
                repository(owner: "${GITHUB_OWNER}", name: "${GITHUB_REPO}") {
                    discussionCategories(first: 10) {
                        nodes {
                            id
                            name
                        }
                    }
                }
            }
        `;
        const result = await this.graphql(query);
        return result.repository.discussionCategories.nodes;
    }

    async getDiscussion(discussionNumber: number) {
        const query = `
            query {
                repository(owner: "${GITHUB_OWNER}", name: "${GITHUB_REPO}") {
                    discussion(number: ${discussionNumber}) {
                        id
                        number
                        title
                        body
                        category {
                            id
                            name
                        }
                        comments(first: 100) {
                            nodes {
                                author {
                                    login
                                }
                                body
                                createdAt
                            }
                        }
                    }
                }
            }
        `;
        const result = await this.graphql(query);
        return result.repository.discussion;
    }

    async addDiscussionComment(discussionNumber: number, body: string) {
        const query = `
            mutation {
                addDiscussionComment(input: {
                    discussionId: "${discussionNumber}",
                    body: "${body}"
                }) {
                    comment {
                        id
                    }
                }
            }
        `;
        return this.graphql(query);
    }
}
