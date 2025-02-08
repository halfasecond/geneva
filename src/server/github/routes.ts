import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { GitHubClient } from '../../utils/github/client';
import { ProjectItemStatus, PullRequestReviewEvent } from '../../utils/github/types';
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
    rateLimiter
} from './middleware';

const router = express.Router();

// Apply middleware to all routes
router.use(logRequest);
router.use(rateLimiter);
router.use(validateAgent);

// Helper to create GitHub client
const createClient = () => new GitHubClient({
    token: process.env.GITHUB_TOKEN!,
    owner: process.env.GITHUB_OWNER!,
    repo: process.env.GITHUB_REPO!
});

// Project board routes
const getProjectBoard: RequestHandler = async (req, res, next) => {
    try {
        const projectNumber = parseInt(req.params.projectNumber);
        const client = createClient();
        const board = await client.getBoardData(projectNumber);
        res.json({ success: true, data: board });
    } catch (error) {
        next(error);
    }
};

router.get('/projects/:projectNumber/board',
    validateProjectNumber,
    getProjectBoard
);

// Issue routes
const createIssue: RequestHandler = async (req, res, next) => {
    try {
        const { title, body } = req.body;
        const client = createClient();
        // Get repository ID first
        const metadata = await client.getProjectMetadata(1);
        const issue = await client.createIssue({
            title,
            body,
            repositoryId: metadata.repositoryId
        });
        res.json({ success: true, data: issue });
    } catch (error) {
        next(error);
    }
};

router.post('/issues',
    validateBody,
    validateIssueType,
    createIssue
);

const addIssueComment: RequestHandler = async (req, res, next) => {
    try {
        const issueNumber = parseInt(req.params.issueNumber);
        const { body } = req.body;
        const client = createClient();
        await client.addIssueComment(issueNumber, body);
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};

router.post('/issues/:issueNumber/comments',
    validateIssueNumber,
    validateBody,
    addIssueComment
);

const updateIssueStatus: RequestHandler = async (req, res, next) => {
    try {
        const issueNumber = parseInt(req.params.issueNumber);
        const { status } = req.body;
        const client = createClient();
        await client.moveIssueToStatus(1, issueNumber, status as ProjectItemStatus);
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};

router.patch('/issues/:issueNumber/status',
    validateIssueNumber,
    validateStatus,
    updateIssueStatus
);

// Pull request routes
const createPullRequestReview: RequestHandler = async (req, res, next) => {
    try {
        const pullNumber = parseInt(req.params.pullNumber);
        const { event, body } = req.body;
        const client = createClient();
        const pr = await client.getPullRequest(pullNumber);
        if (!pr) {
            res.status(404).json({ success: false, error: 'Pull request not found' });
            return;
        }
        const review = await client.createPullRequestReview(pullNumber, {
            pullRequestId: pr.id,
            event: event as PullRequestReviewEvent,
            body
        });
        res.json({ success: true, data: review });
    } catch (error) {
        next(error);
    }
};

router.post('/pulls/:pullNumber/reviews',
    validatePullRequestNumber,
    validateBody,
    createPullRequestReview
);

// Discussion routes
const addDiscussionComment: RequestHandler = async (req, res, next) => {
    try {
        const discussionNumber = parseInt(req.params.discussionNumber);
        const { body } = req.body;
        const client = createClient();
        const discussion = await client.getDiscussion(discussionNumber);
        if (!discussion) {
            res.status(404).json({ success: false, error: 'Discussion not found' });
            return;
        }
        const comment = await client.addComment({
            subjectId: discussion.id,
            body
        });
        res.json({ success: true, data: comment });
    } catch (error) {
        next(error);
    }
};

router.post('/discussions/:discussionNumber/comments',
    validateDiscussionNumber,
    validateBody,
    addDiscussionComment
);

// Error handler
router.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('API Error:', err);
    res.status(500).json({ success: false, error: err.message });
});

export default router;