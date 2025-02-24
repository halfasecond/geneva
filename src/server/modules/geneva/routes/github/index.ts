import express, { Router, Request, Response } from 'express';
import { GitHubClient } from './client';
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
import { PullRequestReviewEvent } from './types';

export default function createGitHubRouter(): Router {
    const router = express.Router();
    const client = new GitHubClient();

    // Apply common middleware
    router.use(express.json());
    router.use(logRequest);
    router.use(rateLimit());

    // Public endpoints (no agent validation required)
    router.get(
        '/issues',
        asyncHandler(async (_req: Request, res: Response) => {
            const issues = await client.listIssues();
            res.json(issues);
        })
    );

    router.get(
        '/issues/:issueNumber',
        validateIssueNumber,
        asyncHandler(async (req: Request, res: Response) => {
            const issueNumber = parseInt(req.params.issueNumber);
            const issue = await client.findIssue(issueNumber);
            res.json(issue);
        })
    );

    router.get(
        '/pulls/:prNumber',
        validatePullRequestNumber,
        asyncHandler(async (req: Request, res: Response) => {
            const prNumber = parseInt(req.params.prNumber);
            const pr = await client.getPullRequest(prNumber);
            res.json(pr);
        })
    );

    router.get(
        '/projects/:projectNumber/board',
        validateProjectNumber,
        asyncHandler(async (req: Request, res: Response) => {
            const projectNumber = parseInt(req.params.projectNumber);
            const board = await client.getBoardData(projectNumber);
            res.json(board);
        })
    );

    router.get(
        '/projects',
        asyncHandler(async (_req: Request, res: Response) => {
            const projects = await client.listProjects();
            res.json(projects);
        })
    );

    // Discussion endpoints
    router.get(
        '/discussions/categories',
        asyncHandler(async (_req: Request, res: Response) => {
            const categories = await client.listDiscussionCategories();
            res.json(categories);
        })
    );

    router.get(
        '/discussions/:discussionNumber',
        validateDiscussionNumber,
        asyncHandler(async (req: Request, res: Response) => {
            const discussionNumber = parseInt(req.params.discussionNumber);
            const discussion = await client.getDiscussion(discussionNumber);
            res.json(discussion);
        })
    );

    router.post(
        '/discussions/:discussionNumber/comments',
        validateDiscussionNumber,
        validateAgent,
        validateBody(['body']),
        asyncHandler(async (req: Request, res: Response) => {
            const { discussionNumber } = req.params;
            const { body } = req.body;
            const result = await client.addDiscussionComment(parseInt(discussionNumber), body);
            res.json(result);
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
            res.json(result);
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
            res.json(fields);
        })
    );

    // Issues
    router.post(
        '/issues',
        validateBody(['type', 'description', 'body', 'projectNumber']),
        validateIssueType,
        asyncHandler(async (req: Request, res: Response) => {
            const { type, description, body, projectNumber } = req.body;
            const metadata = await client.getProjectMetadata(projectNumber);
            const result = await client.createIssue({
                title: `[${type}] ${description}`,
                body,
                repositoryId: metadata.repositoryId
            });
            await client.addIssueToProject(
                result.createIssue.issue.id,
                metadata.projectId
            );
            res.json(result);
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
            res.json({ added: labels });
        })
    );

    // Projects
    router.post(
        '/issues/:issueNumber/project/:projectNumber',
        validateIssueNumber,
        validateProjectNumber,
        asyncHandler(async (req: Request, res: Response) => {
            const { issueNumber, projectNumber } = req.params;
            const metadata = await client.getProjectMetadata(parseInt(projectNumber));
            const item = await client.findProjectItem(metadata.projectId, parseInt(issueNumber));
            if (!item?.content?.id) {
                res.status(404).json({ error: 'Issue not found' });
                return;
            }
            const result = await client.addIssueToProject(
                item.content.id,
                metadata.projectId
            );
            res.json(result);
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
            res.json(result);
        })
    );

    // Pull Requests
    router.post(
        '/pulls',
        validateBody(['type', 'description', 'headBranch', 'baseBranch', 'body', 'projectNumber']),
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
            const result = await client.createPullRequest({
                title: `[${type}] ${description}`,
                body,
                repositoryId: metadata.repositoryId,
                headRefName: headBranch,
                baseRefName: baseBranch
            });
            res.json(result);
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
            res.json({ added: true });
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
            res.json(result);
        })
    );

    // PR Reviews
    router.get(
        '/pulls/:prNumber/reviews',
        validatePullRequestNumber,
        asyncHandler(async (req: Request, res: Response) => {
            const prNumber = parseInt(req.params.prNumber);
            const pr = await client.getPullRequest(prNumber);
            res.json(pr.reviews || { nodes: [] });
        })
    );

    router.post(
        '/pulls/:prNumber/reviews',
        validateBody(['event', 'body']),
        asyncHandler(async (req: Request, res: Response) => {
            const { prNumber } = req.params;
            const { event, body } = req.body;

            if (!Object.values(PullRequestReviewEvent).includes(event)) {
                res.status(400).json({
                    error: 'Invalid review event type. Must be APPROVE, REQUEST_CHANGES, or COMMENT'
                });
                return;
            }

            const pr = await client.getPullRequest(parseInt(prNumber));
            if (!pr) {
                res.status(404).json({ error: 'Pull request not found' });
                return;
            }

            const result = await client.createPullRequestReview(
                parseInt(prNumber),
                { pullRequestId: pr.id, event, body }
            );
            res.json(result);
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
            await client.addLabelsToPullRequest(parseInt(prNumber), labels);
            res.json({ added: labels });
        })
    );

    return router;
}
