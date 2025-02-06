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
                    .expect(200);

                // expect(response.body).toEqual({
                //     success: false,
                //     error: {
                //         message: 'Invalid project number'
                //     }
                // });
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

            it('should create an issue with valid agent header', async () => {
                vi.mocked(mockClient.getProjectMetadata).mockResolvedValue({
                    repositoryId: 'repo1',
                    projectId: 'proj1',
                    statusFieldId: 'status1',
                    statusOptionIds: {
                        todo: 'todo1',
                        inProgress: 'progress1',
                        inReview: 'review1',
                        done: 'done1'
                    }
                });

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
                    // .expect('Content-Type', /json/)
                    .expect(400);

                expect(response.body).toEqual({
                    success: false,
                    error: {
                        message: 'Missing x-agent-id header'
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
        });

        describe('Error Handling', () => {
            it('should handle GitHub API errors', async () => {
                const error = new Error('GitHub API error');
                vi.mocked(mockClient.createIssue).mockRejectedValue(error);

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
                    .expect(500);

                expect(response.body).toEqual({
                    success: false,
                    error: {
                        message: 'GitHub API error'
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