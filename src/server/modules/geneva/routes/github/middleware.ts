import { Request, Response, NextFunction } from 'express';
import { GitHubAPIError, GitHubRequest } from './types';

// Rate limiting
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 60;

const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimit = () => (req: Request, _res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const record = requestCounts.get(ip);

    if (!record || now > record.resetTime) {
        requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    } else {
        if (record.count >= MAX_REQUESTS) {
            throw new GitHubAPIError('Rate limit exceeded', 429);
        }
        record.count++;
    }
    next();
};

export const validateAgent = (req: GitHubRequest, _res: Response, next: NextFunction) => {
    const agent = req.headers['x-agent-id'];
    if (!agent) {
        throw new GitHubAPIError('Agent validation failed', 401);
    }
    req.agent = true;
    next();
};

export const validateBody = (requiredFields: string[]) => 
    (req: Request, _res: Response, next: NextFunction) => {
        const missingFields = requiredFields.filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            throw new GitHubAPIError(
                `Missing required fields: ${missingFields.join(', ')}`,
                400
            );
        }
        next();
    };

export const validateIssueNumber = (req: Request, _res: Response, next: NextFunction) => {
    const issueNumber = parseInt(req.params.issueNumber);
    if (isNaN(issueNumber) || issueNumber <= 0) {
        throw new GitHubAPIError('Invalid issue number', 400);
    }
    next();
};

export const validateProjectNumber = (req: Request, _res: Response, next: NextFunction) => {
    const projectNumber = parseInt(req.params.projectNumber || req.body.projectNumber);
    if (isNaN(projectNumber) || projectNumber <= 0) {
        throw new GitHubAPIError('Invalid project number', 400);
    }
    next();
};

export const validatePullRequestNumber = (req: Request, _res: Response, next: NextFunction) => {
    const prNumber = parseInt(req.params.prNumber);
    if (isNaN(prNumber) || prNumber <= 0) {
        throw new GitHubAPIError('Invalid pull request number', 400);
    }
    next();
};

export const validateDiscussionNumber = (req: Request, _res: Response, next: NextFunction) => {
    const discussionNumber = parseInt(req.params.discussionNumber);
    if (isNaN(discussionNumber) || discussionNumber <= 0) {
        throw new GitHubAPIError('Invalid discussion number', 400);
    }
    next();
};

export const validateIssueType = (req: Request, _res: Response, next: NextFunction) => {
    const validTypes = ['bug', 'feature', 'enhancement', 'documentation'];
    if (!validTypes.includes(req.body.type)) {
        throw new GitHubAPIError(
            `Invalid issue type. Must be one of: ${validTypes.join(', ')}`,
            400
        );
    }
    next();
};

export const validateStatus = (req: Request, _res: Response, next: NextFunction) => {
    const validStatuses = ['Todo', 'In Progress', 'Done', 'Blocked'];
    if (!validStatuses.includes(req.body.status)) {
        throw new GitHubAPIError(
            `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
            400
        );
    }
    next();
};

export const logRequest = (req: Request, _res: Response, next: NextFunction) => {
    console.log(`${req.method} ${req.path}`);
    next();
};
