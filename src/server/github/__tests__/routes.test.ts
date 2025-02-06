import { describe, expect, it, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { GitHubClient } from '../../../utils/github/client';
import { createGitHubRouter } from '../routes';
import { ProjectItemStatus } from '../../../utils/github/types';

// Mock GitHub client
vi.mock('../../../utils/github/client', () => ({
    GitHubClient: vi.fn().mockImplementation(() => ({
        getBoardData: vi.fn(),
        listProjects: vi.fn(),
        getProjectFields: vi.fn(),
        getProjectMetadata: vi.fn(),
        createIssue: vi.fn(),
        addLabelsToIssue: vi.fn(),
        findProjectItem: vi.fn(),
        addIssueToProject: vi.fn(),
        moveIssueToStatus: vi.fn(),
        createPullRequest: vi.fn(),
        addIssueComment: vi.fn(),
        mergePullRequest: vi.fn()
    }))
}));

describe('GitHub API Routes', () => {
    let app: express.Application;
    let mockClient: GitHubClient;
    const mockMetadata = {
        repositoryId: 'repo1',
        projectId: 'proj1',
        statusFieldId: 'status1',
        statusOptionIds: {
            todo: 'todo1',
            inProgress: 'progress1',
            inReview: 'review1',
            done: 'done1'
        }
    };

    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();
        
        mockClient = new GitHubClient({
            token: 'test-token',
            owner: 'test-owner',
            repo: 'test-repo'
        });

        // Create Express app
        app = express();
        app.use('/api/github', createGitHubRouter(mockClient));
    });

    describe('Public Endpoints', () => {
        describe('GET /projects/:projectNumber/board', () => {
            const mockBoard = {
                columns: [
                    {
                        id: 'Todo',
                        title: 'Backlog Field 🌱',
                        cards: []
                    }
                ]
            };

            it('should return board data without requiring agent header', async () => {
                vi.mocked(mockClient.getBoardData).mockResolvedValue(mockBoard);

                const response = await request(app)
                    .get('/api/github/projects/1/board')
                    .expect('Content-Type', /json/)
                    .expect(200);

                expect(response.body).toEqual({
                    success: true,
                    data: mockBoard
                });
                expect(mockClient.getBoardData).toHaveBeenCalledWith(1);
            });

            it('should handle invalid project number', async () => {
                const response = await request(app)
                    .get('/api/github/projects/invalid/board')
                    .expect('Content-Type', /json/)
                    .expect(400);

                expect(response.body).toEqual({
                    success: false,
                    error: {
                        message: 'Invalid project number'
                    }
                });
            });

            it('should handle GitHub API errors', async () => {
                vi.mocked(mockClient.getBoardData).mockRejectedValue(new Error('Board not found'));

                const response = await request(app)
                    .get('/api/github/projects/1/board')
                    .expect('Content-Type', /json/)
                    .expect(500);

                expect(response.body).toEqual({
                    success: false,
                    error: {
                        message: 'Board not found'
                    }
                });
            });
        });

        describe('GET /projects', () => {
            const mockProjects = [
                {
                    id: '1',
                    number: 1,
                    title: 'Test Project',
                    url: 'test-url',
                    closed: false
                }
            ];

            it('should return projects list without requiring agent header', async () => {
                vi.mocked(mockClient.listProjects).mockResolvedValue(mockProjects);

                const response = await request(app)
                    .get('/api/github/projects')
                    .expect('Content-Type', /json/)
                    .expect(200);

                expect(response.body).toEqual({
                    success: true,
                    data: mockProjects
                });
                expect(mockClient.listProjects).toHaveBeenCalled();
            });

            it('should handle GitHub API errors', async () => {
                vi.mocked(mockClient.listProjects).mockRejectedValue(new Error('Failed to fetch projects'));

                const response = await request(app)
                    .get('/api/github/projects')
                    .expect('Content-Type', /json/)
                    .expect(500);

                expect(response.body).toEqual({
                    success: false,
                    error: {
                        message: 'Failed to fetch projects'
                    }
                });
            });
        });

        describe('GET /projects/:projectId/fields', () => {
            const mockFields = [
                { id: 'field1', name: 'Status' },
                { id: 'field2', name: 'Priority' }
            ];

            it('should return project fields with valid agent header', async () => {
                vi.mocked(mockClient.getProjectFields).mockResolvedValue(mockFields);

                const response = await request(app)
                    .get('/api/github/projects/1/fields')
                    .set('x-agent-id', 'horse88')
                    .expect('Content-Type', /json/)
                    .expect(200);

                expect(response.body).toEqual({
                    success: true,
                    data: mockFields
                });
                expect(mockClient.getProjectFields).toHaveBeenCalledWith('1');
            });

            it('should reject request without agent header', async () => {
                const response = await request(app)
                    .get('/api/github/projects/1/fields')
                    .expect('Content-Type', /json/)
                    .expect(400);

                expect(response.body).toEqual({
                    success: false,
                    error: {
                        message: 'Missing x-agent-id header'
                    }
                });
            });
        });
    });

    describe('Protected Endpoints', () => {
        describe('POST /issues', () => {
            const mockIssue = {
                createIssue: {
                    issue: {
                        id: '1',
                        number: 1,
                        url: 'test-url'
                    }
                }
            };

            beforeEach(() => {
                vi.mocked(mockClient.getProjectMetadata).mockResolvedValue(mockMetadata);
            });

            it('should create an issue with valid agent header', async () => {
                vi.mocked(mockClient.createIssue).mockResolvedValue(mockIssue);

                const response = await request(app)
                    .post('/api/github/issues')
                    .set('x-agent-id', 'horse88')
                    .send({
                        type: 'feat',
                        description: 'Test Issue',
                        body: 'Test body',
                        projectNumber: 1
                    })
                    .expect('Content-Type', /json/)
                    .expect(200);

                expect(response.body).toEqual({
                    success: true,
                    data: mockIssue
                });
                expect(mockClient.createIssue).toHaveBeenCalledWith({
                    title: '[feat] Test Issue',
                    body: 'Test body',
                    repositoryId: 'repo1'
                });
            });

            it('should reject request without agent header', async () => {
                const response = await request(app)
                    .post('/api/github/issues')
                    .send({
                        type: 'feat',
                        description: 'Test Issue',
                        body: 'Test body',
                        projectNumber: 1
                    })
                    .expect('Content-Type', /json/)
                    .expect(400);

                expect(response.body).toEqual({
                    success: false,
                    error: {
                        message: 'Missing x-agent-id header'
                    }
                });
            });

            it('should validate required fields', async () => {
                const response = await request(app)
                    .post('/api/github/issues')
                    .set('x-agent-id', 'horse88')
                    .send({
                        type: 'feat',
                        description: 'Test Issue'
                        // missing body field
                    })
                    .expect('Content-Type', /json/)
                    .expect(400);

                expect(response.body).toEqual({
                    success: false,
                    error: {
                        message: 'Missing required field: body'
                    }
                });
            });
        });

        describe('POST /issues/:issueNumber/labels', () => {
            it('should add labels to an issue', async () => {
                const labels = ['bug', 'high-priority'];
                vi.mocked(mockClient.addLabelsToIssue).mockResolvedValue({ added: true });

                const response = await request(app)
                    .post('/api/github/issues/1/labels')
                    .set('x-agent-id', 'horse88')
                    .send({ labels })
                    .expect('Content-Type', /json/)
                    .expect(200);

                expect(response.body).toEqual({
                    success: true,
                    data: { added: labels }
                });
                expect(mockClient.addLabelsToIssue).toHaveBeenCalledWith(1, labels);
            });

            it('should validate issue number', async () => {
                const response = await request(app)
                    .post('/api/github/issues/invalid/labels')
                    .set('x-agent-id', 'horse88')
                    .send({ labels: ['bug'] })
                    .expect('Content-Type', /json/)
                    .expect(400);

                expect(response.body).toEqual({
                    success: false,
                    error: {
                        message: 'Invalid issue number'
                    }
                });
            });
        });

        describe('POST /issues/:issueNumber/project/:projectNumber', () => {
            beforeEach(() => {
                vi.mocked(mockClient.getProjectMetadata).mockResolvedValue(mockMetadata);
            });

            it('should add issue to project', async () => {
                vi.mocked(mockClient.findProjectItem).mockResolvedValue({
                    content: { id: 'issue1' }
                });
                vi.mocked(mockClient.addIssueToProject).mockResolvedValue({ added: true });

                const response = await request(app)
                    .post('/api/github/issues/1/project/1')
                    .set('x-agent-id', 'horse88')
                    .expect('Content-Type', /json/)
                    .expect(200);

                expect(response.body).toEqual({
                    success: true,
                    data: { added: true }
                });
                expect(mockClient.addIssueToProject).toHaveBeenCalledWith('issue1', 'proj1');
            });

            it('should handle issue not found', async () => {
                vi.mocked(mockClient.findProjectItem).mockResolvedValue({
                    content: null
                });

                const response = await request(app)
                    .post('/api/github/issues/1/project/1')
                    .set('x-agent-id', 'horse88')
                    .expect('Content-Type', /json/)
                    .expect(404);

                expect(response.body).toEqual({
                    success: false,
                    error: {
                        message: 'Issue not found'
                    }
                });
            });
        });

        describe('POST /issues/:issueNumber/status', () => {
            it('should update issue status', async () => {
                vi.mocked(mockClient.moveIssueToStatus).mockResolvedValue({
                    updateProjectV2ItemFieldValue: {
                        projectV2Item: {
                            id: '1'
                        }
                    }
                });

                const response = await request(app)
                    .post('/api/github/issues/1/status')
                    .set('x-agent-id', 'horse88')
                    .send({
                        status: ProjectItemStatus.IN_PROGRESS,
                        projectNumber: 1
                    })
                    .expect('Content-Type', /json/)
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(mockClient.moveIssueToStatus).toHaveBeenCalledWith(
                    1,
                    1,
                    ProjectItemStatus.IN_PROGRESS
                );
            });

            it('should validate status value', async () => {
                const response = await request(app)
                    .post('/api/github/issues/1/status')
                    .set('x-agent-id', 'horse88')
                    .send({
                        status: 'invalid-status',
                        projectNumber: 1
                    })
                    .expect('Content-Type', /json/)
                    .expect(400);

                expect(response.body).toEqual({
                    success: false,
                    error: {
                        message: 'Invalid status value'
                    }
                });
            });
        });

        describe('POST /pulls', () => {
            beforeEach(() => {
                vi.mocked(mockClient.getProjectMetadata).mockResolvedValue(mockMetadata);
            });

            it('should create a pull request', async () => {
                const mockPR = {
                    createPullRequest: {
                        pullRequest: {
                            id: '1',
                            number: 1,
                            url: 'test-url'
                        }
                    }
                };
                vi.mocked(mockClient.createPullRequest).mockResolvedValue(mockPR);

                const response = await request(app)
                    .post('/api/github/pulls')
                    .set('x-agent-id', 'horse88')
                    .send({
                        type: 'feat',
                        description: 'Test PR',
                        issueNumber: 1,
                        headBranch: 'feature/test',
                        baseBranch: 'main',
                        body: 'Test body',
                        projectNumber: 1
                    })
                    .expect('Content-Type', /json/)
                    .expect(200);

                expect(response.body).toEqual({
                    success: true,
                    data: mockPR
                });
                expect(mockClient.createPullRequest).toHaveBeenCalledWith({
                    title: '[feat] Test PR',
                    body: 'Test body',
                    repositoryId: 'repo1',
                    headRefName: 'feature/test',
                    baseRefName: 'main'
                });
            });

            it('should validate required fields', async () => {
                const response = await request(app)
                    .post('/api/github/pulls')
                    .set('x-agent-id', 'horse88')
                    .send({
                        type: 'feat',
                        description: 'Test PR'
                        // missing required fields
                    })
                    .expect('Content-Type', /json/)
                    .expect(400);

                expect(response.body.success).toBe(false);
                expect(response.body.error.message).toMatch(/Missing required field/);
            });
        });

        describe('POST /issues/:issueNumber/comments', () => {
            it('should add a comment to an issue', async () => {
                vi.mocked(mockClient.addIssueComment).mockResolvedValue({ added: true });

                const response = await request(app)
                    .post('/api/github/issues/1/comments')
                    .set('x-agent-id', 'horse88')
                    .send({
                        body: 'Test comment'
                    })
                    .expect('Content-Type', /json/)
                    .expect(200);

                expect(response.body).toEqual({
                    success: true,
                    data: { added: true }
                });
                expect(mockClient.addIssueComment).toHaveBeenCalledWith(1, 'Test comment');
            });

            it('should validate comment body', async () => {
                const response = await request(app)
                    .post('/api/github/issues/1/comments')
                    .set('x-agent-id', 'horse88')
                    .send({})
                    .expect('Content-Type', /json/)
                    .expect(400);

                expect(response.body).toEqual({
                    success: false,
                    error: {
                        message: 'Missing required field: body'
                    }
                });
            });
        });

        describe('POST /pulls/:prNumber/merge', () => {
            it('should merge a pull request', async () => {
                vi.mocked(mockClient.mergePullRequest).mockResolvedValue({ merged: true });

                const response = await request(app)
                    .post('/api/github/pulls/1/merge')
                    .set('x-agent-id', 'horse88')
                    .send({
                        commitHeadline: 'Merge PR',
                        commitBody: 'Merged test PR'
                    })
                    .expect('Content-Type', /json/)
                    .expect(200);

                expect(response.body).toEqual({
                    success: true,
                    data: { merged: true }
                });
                expect(mockClient.mergePullRequest).toHaveBeenCalledWith({
                    prNumber: 1,
                    commitHeadline: 'Merge PR',
                    commitBody: 'Merged test PR'
                });
            });

            it('should validate required fields', async () => {
                const response = await request(app)
                    .post('/api/github/pulls/1/merge')
                    .set('x-agent-id', 'horse88')
                    .send({})
                    .expect('Content-Type', /json/)
                    .expect(400);

                expect(response.body.success).toBe(false);
                expect(response.body.error.message).toMatch(/Missing required field/);
            });
        });

        describe('Rate Limiting', () => {
            it('should enforce rate limits', async () => {
                const makeRequest = () => request(app)
                    .get('/api/github/projects')
                    .set('x-agent-id', 'horse88');

                // Make 60 requests (the limit)
                for (let i = 0; i < 60; i++) {
                    await makeRequest();
                }

                // The 61st request should fail
                const response = await makeRequest()
                    .expect('Content-Type', /json/)
                    .expect(429);

                expect(response.body).toEqual({
                    success: false,
                    error: {
                        message: 'Too many requests'
                    }
                });
            });
        });

        describe('Error Handling', () => {
            it('should handle GitHub API errors', async () => {
                vi.mocked(mockClient.getProjectMetadata).mockRejectedValue(new Error('Project not found'));

                const response = await request(app)
                    .post('/api/github/issues')
                    .set('x-agent-id', 'horse88')
                    .send({
                        type: 'feat',
                        description: 'Test Issue',
                        body: 'Test body',
                        projectNumber: 1
                    })
                    .expect('Content-Type', /json/)
                    .expect(404);

                expect(response.body).toEqual({
                    success: false,
                    error: {
                        message: 'Project not found'
                    }
                });
            });

            it('should handle validation errors', async () => {
                const response = await request(app)
                    .post('/api/github/issues')
                    .set('x-agent-id', 'horse88')
                    .send({
                        type: 'invalid',
                        description: 'Test Issue',
                        body: 'Test body',
                        projectNumber: 1
                    })
                    .expect('Content-Type', /json/)
                    .expect(400);

                expect(response.body).toEqual({
                    success: false,
                    error: {
                        message: 'Invalid issue type'
                    }
                });
            });
        });
    });
});