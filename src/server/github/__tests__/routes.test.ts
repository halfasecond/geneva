import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createGitHubRouter } from '../routes';
import { GitHubClient } from '../../../utils/github/client';

describe('GitHub API Routes', () => {
    let app: express.Application;
    let mockClient: GitHubClient;

    beforeEach(() => {
        app = express();
        mockClient = {
            getBoardData: vi.fn(),
            listProjects: vi.fn(),
            getProjectFields: vi.fn(),
            getProjectMetadata: vi.fn(),
            getOrCreateLabel: vi.fn(),
            addLabels: vi.fn(),
            createIssue: vi.fn(),
            createPullRequest: vi.fn(),
            updateItemStatus: vi.fn(),
            findProjectItem: vi.fn(),
            findIssue: vi.fn(),
            getPullRequest: vi.fn(),
            addComment: vi.fn(),
            addIssueComment: vi.fn(),
            addIssueToProject: vi.fn(),
            mergePullRequest: vi.fn(),
            addLabelsToIssue: vi.fn(),
            moveIssueToStatus: vi.fn(),
            createPullRequestReview: vi.fn()
        };

        const router = createGitHubRouter(mockClient);
        app.use(router);
    });

    describe('Public Endpoints', () => {
        describe('GET /issues/:issueNumber', () => {
            it('should return issue data', async () => {
                const mockIssue = {
                    id: 'issue-1',
                    number: 25,
                    title: 'Test Issue',
                    body: 'Issue body',
                    url: 'https://github.com/org/repo/issues/25',
                    state: 'open',
                    labels: {
                        nodes: [
                            { id: 'label-1', name: 'bug', color: 'red' }
                        ]
                    },
                    comments: {
                        nodes: [
                            {
                                id: 'comment-1',
                                body: 'Test comment',
                                author: { login: 'user1' },
                                createdAt: '2025-02-06T11:00:00Z'
                            }
                        ]
                    }
                };

                (mockClient.findIssue as any).mockResolvedValue(mockIssue);

                const response = await request(app)
                    .get('/issues/25')
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data).toEqual(mockIssue);
                expect(mockClient.findIssue).toHaveBeenCalledWith(25);
            });

            it('should handle issue not found', async () => {
                (mockClient.findIssue as any).mockResolvedValue(null);

                const response = await request(app)
                    .get('/issues/999')
                    .expect(404);

                expect(response.body.success).toBe(false);
                expect(response.body.error.message).toBe('Issue not found');
            });

            it('should validate issue number format', async () => {
                const response = await request(app)
                    .get('/issues/invalid')
                    .expect(400);

                expect(response.body.success).toBe(false);
                expect(response.body.error.message).toBe('Invalid issue number');
            });
        });

        describe('GET /pulls/:prNumber', () => {
            it('should return pull request data', async () => {
                const mockPR = {
                    id: 'pr-1',
                    number: 25,
                    title: 'Test PR',
                    url: 'https://github.com/org/repo/pull/25',
                    headRefName: 'feature-branch',
                    baseRefName: 'main',
                    headRefOid: 'abc123',
                    comments: {
                        nodes: [
                            {
                                id: 'comment-1',
                                body: 'Test comment',
                                author: { login: 'user1' },
                                createdAt: '2025-02-06T11:00:00Z'
                            }
                        ]
                    }
                };

                (mockClient.getPullRequest as any).mockResolvedValue(mockPR);

                const response = await request(app)
                    .get('/pulls/25')
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data).toEqual(mockPR);
                expect(mockClient.getPullRequest).toHaveBeenCalledWith(25);
            });

            it('should handle pull request not found', async () => {
                (mockClient.getPullRequest as any).mockResolvedValue(null);

                const response = await request(app)
                    .get('/pulls/999')
                    .expect(404);

                expect(response.body.success).toBe(false);
                expect(response.body.error.message).toBe('Pull request not found');
            });

            it('should validate pull request number format', async () => {
                const response = await request(app)
                    .get('/pulls/invalid')
                    .expect(400);

                expect(response.body.success).toBe(false);
                expect(response.body.error.message).toBe('Invalid pull request number');
            });
        });

        describe('GET /projects/:projectNumber/board', () => {
            it('should return board data without requiring agent header', async () => {
                const mockBoard = {
                    columns: [
                        {
                            id: 'col1',
                            title: 'Todo',
                            cards: []
                        }
                    ]
                };

                (mockClient.getBoardData as any).mockResolvedValue(mockBoard);

                const response = await request(app)
                    .get('/projects/1/board')
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data).toEqual(mockBoard);
            });

            it('should handle invalid project number', async () => {
                const response = await request(app)
                    .get('/projects/invalid/board')
                    .expect(400);

                expect(response.body.success).toBe(false);
                expect(response.body.error.message).toBe('Invalid project number');
            });

            it('should handle GitHub API errors', async () => {
                (mockClient.getBoardData as any).mockRejectedValue(new Error('Board not found'));

                const response = await request(app)
                    .get('/projects/1/board')
                    .expect(500);

                expect(response.body.success).toBe(false);
                expect(response.body.error.message).toBe('Board not found');
            });
        });

        describe('GET /projects', () => {
            it('should return projects list without requiring agent header', async () => {
                const mockProjects = [
                    { id: '1', title: 'Project 1' }
                ];

                (mockClient.listProjects as any).mockResolvedValue(mockProjects);

                const response = await request(app)
                    .get('/projects')
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data).toEqual(mockProjects);
            });

            it('should handle GitHub API errors', async () => {
                (mockClient.listProjects as any).mockRejectedValue(new Error('Failed to fetch projects'));

                const response = await request(app)
                    .get('/projects')
                    .expect(500);

                expect(response.body.success).toBe(false);
                expect(response.body.error.message).toBe('Failed to fetch projects');
            });
        });

        describe('GET /projects/:projectId/fields', () => {
            it('should return project fields with valid agent header', async () => {
                const mockFields = [
                    { id: 'field1', name: 'Status' }
                ];

                (mockClient.getProjectFields as any).mockResolvedValue(mockFields);

                const response = await request(app)
                    .get('/projects/123/fields')
                    .set('x-agent-id', 'horse21')
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data).toEqual(mockFields);
            });

            it('should reject request without agent header', async () => {
                const response = await request(app)
                    .get('/projects/123/fields')
                    .expect(401);

                expect(response.body.success).toBe(false);
                expect(response.body.error.message).toBe('Agent header required');
            });
        });
    });

    describe('Protected Endpoints', () => {
        describe('POST /issues', () => {
            it('should create an issue with valid agent header', async () => {
                const mockResult = {
                    createIssue: {
                        issue: {
                            id: '1',
                            number: 123,
                            url: 'https://github.com/org/repo/issues/123'
                        }
                    }
                };

                (mockClient.getProjectMetadata as any).mockResolvedValue({ repositoryId: 'repo1' });
                (mockClient.createIssue as any).mockResolvedValue(mockResult);

                const response = await request(app)
                    .post('/issues')
                    .set('x-agent-id', 'horse21')
                    .send({
                        type: 'feat',
                        description: 'New feature',
                        body: 'Feature description',
                        projectNumber: 1
                    })
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data).toEqual(mockResult);
            });

            it('should reject request without agent header', async () => {
                const response = await request(app)
                    .post('/issues')
                    .send({
                        type: 'feat',
                        description: 'New feature',
                        body: 'Feature description'
                    })
                    .expect(401);

                expect(response.body.success).toBe(false);
                expect(response.body.error.message).toBe('Agent header required');
            });

            it('should validate required fields', async () => {
                const response = await request(app)
                    .post('/issues')
                    .set('x-agent-id', 'horse21')
                    .send({})
                    .expect(400);

                expect(response.body.success).toBe(false);
                expect(response.body.error.message).toBe('Missing required fields: type, description, body, projectNumber');
            });
        });

        describe('POST /issues/:issueNumber/labels', () => {
            it('should add labels to an issue', async () => {
                const mockResult = {
                    addLabelsToLabelable: {
                        labelable: {
                            labels: {
                                nodes: [
                                    { id: '1', name: 'bug' }
                                ]
                            }
                        }
                    }
                };

                (mockClient.addLabelsToIssue as any).mockResolvedValue(mockResult);

                const response = await request(app)
                    .post('/issues/123/labels')
                    .set('x-agent-id', 'horse21')
                    .send({ labels: ['bug'] })
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data).toEqual({ added: ['bug'] });
            });

            it('should validate issue number', async () => {
                const response = await request(app)
                    .post('/issues/invalid/labels')
                    .set('x-agent-id', 'horse21')
                    .send({ labels: ['bug'] })
                    .expect(400);

                expect(response.body.success).toBe(false);
                expect(response.body.error.message).toBe('Invalid issue number');
            });
        });

        describe('POST /issues/:issueNumber/project/:projectNumber', () => {
            it('should add issue to project', async () => {
                (mockClient.getProjectMetadata as any).mockResolvedValue({ projectId: 'proj1' });
                (mockClient.findProjectItem as any).mockResolvedValue({
                    content: { id: 'issue1' }
                });
                (mockClient.addIssueToProject as any).mockResolvedValue({ added: true });

                const response = await request(app)
                    .post('/issues/123/project/1')
                    .set('x-agent-id', 'horse21')
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data).toEqual({ added: true });
            });

            it('should handle issue not found', async () => {
                (mockClient.getProjectMetadata as any).mockResolvedValue({ projectId: 'proj1' });
                (mockClient.findProjectItem as any).mockResolvedValue(null);

                const response = await request(app)
                    .post('/issues/123/project/1')
                    .set('x-agent-id', 'horse21')
                    .expect(404);

                expect(response.body.success).toBe(false);
                expect(response.body.error.message).toBe('Issue not found');
            });
        });

        describe('POST /issues/:issueNumber/status', () => {
            it('should update issue status', async () => {
                const mockResult = {
                    updateProjectV2ItemFieldValue: {
                        projectV2Item: { id: '1' }
                    }
                };

                (mockClient.moveIssueToStatus as any).mockResolvedValue(mockResult);

                const response = await request(app)
                    .post('/issues/123/status')
                    .set('x-agent-id', 'horse21')
                    .send({
                        status: 'todo',
                        projectNumber: 1
                    })
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data).toEqual(mockResult);
            });

            it('should validate status value', async () => {
                const response = await request(app)
                    .post('/issues/123/status')
                    .set('x-agent-id', 'horse21')
                    .send({
                        status: 'invalid',
                        projectNumber: 1
                    })
                    .expect(400);

                expect(response.body.success).toBe(false);
                expect(response.body.error.message).toBe('Invalid status value');
            });
        });

        describe('POST /pulls', () => {
            it('should create a pull request', async () => {
                const mockResult = {
                    createPullRequest: {
                        pullRequest: {
                            id: '1',
                            number: 123,
                            url: 'https://github.com/org/repo/pull/123'
                        }
                    }
                };

                (mockClient.getProjectMetadata as any).mockResolvedValue({ repositoryId: 'repo1' });
                (mockClient.createPullRequest as any).mockResolvedValue(mockResult);

                const response = await request(app)
                    .post('/pulls')
                    .set('x-agent-id', 'horse21')
                    .send({
                        type: 'feat',
                        description: 'New feature',
                        issueNumber: 123,
                        headBranch: 'feature',
                        baseBranch: 'main',
                        body: 'PR description',
                        projectNumber: 1
                    })
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data).toEqual(mockResult);
            });

            it('should validate required fields', async () => {
                const response = await request(app)
                    .post('/pulls')
                    .set('x-agent-id', 'horse21')
                    .send({})
                    .expect(400);

                expect(response.body.success).toBe(false);
                expect(response.body.error.message).toBe('Missing required fields: type, description, issueNumber, headBranch, baseBranch, body, projectNumber');
            });
        });

        describe('POST /issues/:issueNumber/comments', () => {
            it('should add a comment to an issue', async () => {
                (mockClient.addIssueComment as any).mockResolvedValue({ added: true });

                const response = await request(app)
                    .post('/issues/123/comments')
                    .set('x-agent-id', 'horse21')
                    .send({ body: 'Test comment' })
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data).toEqual({ added: true });
            });

            it('should validate comment body', async () => {
                const response = await request(app)
                    .post('/issues/123/comments')
                    .set('x-agent-id', 'horse21')
                    .send({})
                    .expect(400);

                expect(response.body.success).toBe(false);
                expect(response.body.error.message).toBe('Missing required fields: body');
            });
        });

        describe('POST /pulls/:prNumber/merge', () => {
            it('should merge a pull request', async () => {
                const mockResult = {
                    sha: 'abc123',
                    merged: true,
                    message: 'Successfully merged'
                };

                (mockClient.mergePullRequest as any).mockResolvedValue(mockResult);

                const response = await request(app)
                    .post('/pulls/123/merge')
                    .set('x-agent-id', 'horse21')
                    .send({
                        commitHeadline: 'Merge PR',
                        commitBody: 'Merge description'
                    })
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data).toEqual(mockResult);
            });

            it('should validate required fields', async () => {
                const response = await request(app)
                    .post('/pulls/123/merge')
                    .set('x-agent-id', 'horse21')
                    .send({})
                    .expect(400);

                expect(response.body.success).toBe(false);
                expect(response.body.error.message).toBe('Missing required fields: commitHeadline, commitBody');
            });
        });

        describe('POST /pulls/:prNumber/reviews', () => {
            it('should create a pull request review', async () => {
                const mockResult = {
                    addPullRequestReview: {
                        pullRequestReview: {
                            id: 'review1',
                            body: 'LGTM!',
                            state: 'APPROVE',
                            author: {
                                login: 'horse21'
                            },
                            createdAt: '2025-02-06T12:00:00Z'
                        }
                    }
                };

                (mockClient.createPullRequestReview as any).mockResolvedValue(mockResult);

                const response = await request(app)
                    .post('/pulls/123/reviews')
                    .set('x-agent-id', 'horse21')
                    .send({
                        event: 'APPROVE',
                        body: 'LGTM!'
                    })
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data).toEqual(mockResult);
            });

            it('should validate review event type', async () => {
                const response = await request(app)
                    .post('/pulls/123/reviews')
                    .set('x-agent-id', 'horse21')
                    .send({
                        event: 'INVALID',
                        body: 'Test review'
                    })
                    .expect(400);

                expect(response.body.success).toBe(false);
                expect(response.body.error.message).toBe('Invalid review event type. Must be APPROVE, REQUEST_CHANGES, or COMMENT');
            });

            it('should validate required fields', async () => {
                const response = await request(app)
                    .post('/pulls/123/reviews')
                    .set('x-agent-id', 'horse21')
                    .send({})
                    .expect(400);

                expect(response.body.success).toBe(false);
                expect(response.body.error.message).toBe('Missing required fields: event, body');
            });
        });

        describe('Rate Limiting', () => {
            it('should enforce rate limits', async () => {
                // Make multiple requests quickly
                const requests = Array(70).fill(null).map(() =>
                    request(app).get('/projects')
                );

                const responses = await Promise.all(requests);
                const tooManyRequests = responses.some(r => r.status === 429);
                expect(tooManyRequests).toBe(true);
            });
        });

        describe('Error Handling', () => {
            it('should handle GitHub API errors', async () => {
                (mockClient.createIssue as any).mockRejectedValue(new Error('Project not found'));

                const response = await request(app)
                    .post('/issues')
                    .set('x-agent-id', 'horse21')
                    .send({
                        type: 'feat',
                        description: 'New feature',
                        body: 'Description',
                        projectNumber: 999
                    })
                    .expect(404);

                expect(response.body.success).toBe(false);
                expect(response.body.error.message).toBe('Project not found');
            });

            it('should handle validation errors', async () => {
                const response = await request(app)
                    .post('/issues')
                    .set('x-agent-id', 'horse21')
                    .send({
                        type: 'invalid',
                        description: 'New feature',
                        body: 'Description'
                    })
                    .expect(400);

                expect(response.body.success).toBe(false);
                expect(response.body.error.message).toBe('Missing required fields: projectNumber');
            });
        });
    });
});