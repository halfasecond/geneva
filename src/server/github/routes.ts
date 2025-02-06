import express, { Router, Request, Response, NextFunction } from 'express';
import { GitHubClient } from '../../utils/github/client';
import { asyncHandler } from './errors';
import {
    validateAgent,
    validateBody,
    validateIssueNumber,
    validateProjectNumber,
    validateIssueType,
    validateStatus,
    validatePullRequestNumber,
    validateDiscussionNumber,
    logRequest,
    rateLimit
} from './middleware';
import { PullRequestReviewEvent } from '../../utils/github/types';
import { sendSuccessResponse } from './errors';
import { GitHubAPIError } from './types';

export function createGitHubRouter(client: GitHubClient): Router {
    const router = express.Router();

    // Apply common middleware
    router.use(express.json());
    router.use(logRequest);
    router.use(rateLimit());

    // Public endpoints (no agent validation required)
    router.get(
        '/issues/:issueNumber',
        validateIssueNumber,
        asyncHandler(async (req: Request, res: Response) => {
            const issueNumber = parseInt(req.params.issueNumber);
            const issue = await client.findIssue(issueNumber);
            if (!issue) {
                throw new GitHubAPIError('Issue not found', 404);
            }
            sendSuccessResponse(res, issue);
        })
    );

    router.get(
        '/pulls/:prNumber',
        validatePullRequestNumber,
        asyncHandler(async (req: Request, res: Response) => {
            const prNumber = parseInt(req.params.prNumber);
            const pr = await client.getPullRequest(prNumber);
            if (!pr || pr === null) {
                throw new GitHubAPIError('Pull request not found', 404);
            }
            sendSuccessResponse(res, pr);
        })
    );

    router.get(
        '/projects/:projectNumber/board',
        validateProjectNumber,
        asyncHandler(async (req: Request, res: Response) => {
            const projectNumber = parseInt(req.params.projectNumber);
            const board = await client.getBoardData(projectNumber);
            sendSuccessResponse(res, board);
        })
    );
    router.get(
        '/projects',
        asyncHandler(async (_req: Request, res: Response) => {
            const projects = await client.listProjects();
            sendSuccessResponse(res, projects);
        })
    );

    // Discussion endpoints
    router.get(
        '/discussions/categories',
        asyncHandler(async (_req: Request, res: Response) => {
            const categories = await client.listDiscussionCategories();
            sendSuccessResponse(res, categories);
        })
    );

    router.get(
        '/discussions/:discussionNumber',
        validateDiscussionNumber,
        asyncHandler(async (req: Request, res: Response) => {
            const discussionNumber = parseInt(req.params.discussionNumber);
            const discussion = await client.getDiscussion(discussionNumber);
            if (!discussion) {
                throw new GitHubAPIError('Discussion not found', 404);
            }
            sendSuccessResponse(res, discussion);
        })
    );

    router.post(
        '/discussions',
        validateAgent,
        validateBody(['title', 'body', 'categoryId', 'projectNumber']),
        asyncHandler(async (req: Request, res: Response) => {
            const { title, body, categoryId, projectNumber } = req.body;
            const metadata = await client.getProjectMetadata(projectNumber);
            
            const result = await client.createDiscussion({
                title,
                body,
                categoryId,
                repositoryId: metadata.repositoryId
            });

            sendSuccessResponse(res, result);
        })
    );

    // Protected endpoints (require agent validation)
    router.use(validateAgent);

    // Get Project Fields
    router.get(
        '/projects/:projectId/fields',
        asyncHandler(async (req: Request, res: Response) => {
            const { projectId } = req.params;
            const fields = await client.getProjectFields(projectId);
            sendSuccessResponse(res, fields);
        })
    );

    // Issues
    router.post(
        '/issues',
        validateBody(['type', 'description', 'body', 'projectNumber']),
        validateIssueType,
        asyncHandler(async (req: Request, res: Response) => {
            const { type, description, body, projectNumber } = req.body;

            try {
                const metadata = await client.getProjectMetadata(projectNumber);
                if (!metadata) {
                    throw new GitHubAPIError('Project not found', 404);
                }

                const result = await client.createIssue({
                    title: `[${type}] ${description}`,
                    body,
                    repositoryId: metadata.repositoryId
                });

                sendSuccessResponse(res, result);
            } catch (error) {
                if (error instanceof GitHubAPIError) {
                    throw error;
                }
                throw new GitHubAPIError('Project not found', 404);
            }
        })
    );

    // Labels
    router.post(
        '/issues/:issueNumber/labels',
        validateIssueNumber,
        validateBody(['labels']),
        asyncHandler(async (req: Request, res: Response) => {
            const { labels } = req.body;
            const { issueNumber } = req.params;

            await client.addLabelsToIssue(parseInt(issueNumber), labels);
            sendSuccessResponse(res, { added: labels });
        })
    );

    // Projects
    router.post(
        '/issues/:issueNumber/project/:projectNumber',
        validateIssueNumber,
        validateProjectNumber,
        asyncHandler(async (req: Request, res: Response) => {
            const { issueNumber, projectNumber } = req.params;
            const projectNum = parseInt(projectNumber);

            const metadata = await client.getProjectMetadata(projectNum);
            const item = await client.findProjectItem(metadata.projectId, parseInt(issueNumber));

            if (!item?.content?.id) {
                throw new GitHubAPIError('Issue not found', 404);
            }

            const result = await client.addIssueToProject(
                item.content.id,
                metadata.projectId
            );
            sendSuccessResponse(res, result);
        })
    );

    // Status Updates
    router.post(
        '/issues/:issueNumber/status',
        validateIssueNumber,
        validateBody(['status', 'projectNumber']),
        validateStatus,
        asyncHandler(async (req: Request, res: Response) => {
            const { status, projectNumber } = req.body;
            const { issueNumber } = req.params;

            const result = await client.moveIssueToStatus(
                projectNumber,
                parseInt(issueNumber),
                status
            );
            sendSuccessResponse(res, result);
        })
    );

    // Pull Requests
    router.post(
        '/pulls',
        validateBody(['type', 'description', 'issueNumber', 'headBranch', 'baseBranch', 'body', 'projectNumber']),
        validateIssueType,
        asyncHandler(async (req: Request, res: Response) => {
            const {
                type,
                description,
                headBranch,
                baseBranch,
                body,
                projectNumber
            } = req.body;

            const metadata = await client.getProjectMetadata(projectNumber);
            if (!metadata) {
                throw new GitHubAPIError('Project not found', 404);
            }

            const result = await client.createPullRequest({
                title: `[${type}] ${description}`,
                body,
                repositoryId: metadata.repositoryId,
                headRefName: headBranch,
                baseRefName: baseBranch
            });

            sendSuccessResponse(res, result);
        })
    );

    // Comments
    router.post(
        '/issues/:issueNumber/comments',
        validateIssueNumber,
        validateBody(['body']),
        asyncHandler(async (req: Request, res: Response) => {
            const { body } = req.body;
            const { issueNumber } = req.params;

            await client.addIssueComment(parseInt(issueNumber), body);
            sendSuccessResponse(res, { added: true });
        })
    );

    // Merge PRs
    router.post(
        '/pulls/:prNumber/merge',
        validateBody(['commitHeadline', 'commitBody']),
        asyncHandler(async (req: Request, res: Response) => {
            const { prNumber } = req.params;
            const { commitHeadline, commitBody } = req.body;

            const result = await client.mergePullRequest({
                prNumber: parseInt(prNumber),
                commitHeadline,
                commitBody
            });

            sendSuccessResponse(res, result);
        })
    );

    // Add PR review endpoint
    router.post(
        '/pulls/:prNumber/reviews',
        validateBody(['event', 'body']),
        asyncHandler(async (req: Request, res: Response) => {
            const { prNumber } = req.params;
            const { event, body } = req.body;

            // Validate review event type
            if (!Object.values(PullRequestReviewEvent).includes(event)) {
                throw new GitHubAPIError('Invalid review event type. Must be APPROVE, REQUEST_CHANGES, or COMMENT', 400);
            }

            const pr = await client.getPullRequest(parseInt(prNumber));
            if (!pr) {
                throw new GitHubAPIError('Pull request not found', 404);
            }

            const result = await client.createPullRequestReview(
                parseInt(prNumber),
                { pullRequestId: pr.id, event, body }
            );

            sendSuccessResponse(res, result);
        })
    );

    // Add labels to PR
    router.post(
        '/pulls/:prNumber/labels',
        validatePullRequestNumber,
        validateBody(['labels']),
        asyncHandler(async (req: Request, res: Response) => {
            const { labels } = req.body;
            const { prNumber } = req.params;

            const pr = await client.getPullRequest(parseInt(prNumber));
            if (!pr) {
                throw new GitHubAPIError('Pull request not found', 404);
            }

            await client.addLabels(pr.id, labels);
            sendSuccessResponse(res, { added: labels });
        })
    );

    // Error handling middleware must be last
    router.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
        console.error('Error in router:', err);
        
        res.setHeader('Content-Type', 'application/json');
        
        if (err instanceof GitHubAPIError) {
            res.status(err.statusCode).json({
                success: false,
                error: {
                    message: err.message,
                    details: err.details
                }
            });
        } else {
            res.status(500).json({
                success: false,
                error: {
                    message: err instanceof Error ? err.message : 'Internal server error'
                }
            });
        }
    });

    return router;
}