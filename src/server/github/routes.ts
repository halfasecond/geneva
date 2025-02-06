import express, { Router, Request, Response } from 'express';
import { GitHubClient } from '../../utils/github/client';
import { asyncHandler } from './errors';
import {
    validateAgent,
    validateBody,
    validateIssueNumber,
    validateProjectNumber,
    validateIssueType,
    logRequest,
    rateLimit
} from './middleware';
import { sendSuccessResponse } from './errors';
import { GitHubAPIError } from './types';
import type {
    CreateIssueRequest,
    AddLabelsRequest,
    UpdateStatusRequest,
    CreatePullRequestRequest,
    AddCommentRequest,
    MergePullRequestRequest
} from './types';

export function createGitHubRouter(client: GitHubClient): Router {
    const router = express.Router();

    // Apply common middleware
    router.use(express.json());
    router.use(logRequest);
    router.use(rateLimit());

    // Public endpoints (no agent validation required)
    router.get(
        '/projects/:projectNumber/board',
        asyncHandler(async (_req: Request, res: Response) => {
            const projectNumber = parseInt(_req.params.projectNumber);
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
        validateBody(['type', 'description', 'body']),
        validateIssueType,
        asyncHandler(async (req: Request, res: Response) => {
            const { type, description, body, projectNumber }: CreateIssueRequest = req.body;
            
            const metadata = await client.getProjectMetadata(projectNumber!);
            const result = await client.createIssue({
                title: `[${type}] ${description}`,
                body,
                repositoryId: metadata.repositoryId
            });

            sendSuccessResponse(res, result);
        })
    );

    // Labels
    router.post(
        '/issues/:issueNumber/labels',
        validateIssueNumber,
        validateBody(['labels']),
        asyncHandler(async (req: Request, res: Response) => {
            const { labels }: AddLabelsRequest = req.body;
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
        asyncHandler(async (req: Request, res: Response) => {
            const { status, projectNumber }: UpdateStatusRequest = req.body;
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
        validateBody(['type', 'description', 'issueNumber', 'headBranch', 'baseBranch', 'body']),
        validateIssueType,
        asyncHandler(async (req: Request, res: Response) => {
            const {
                type,
                description,
                headBranch,
                baseBranch,
                body,
                projectNumber
            }: CreatePullRequestRequest = req.body;

            const metadata = await client.getProjectMetadata(projectNumber);
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
            const { body }: AddCommentRequest = req.body;
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
            const {
                commitHeadline,
                commitBody
            }: MergePullRequestRequest = req.body;

            const result = await client.mergePullRequest({
                prNumber: parseInt(prNumber),
                commitHeadline,
                commitBody
            });

            sendSuccessResponse(res, result);
        })
    );

    return router;
}