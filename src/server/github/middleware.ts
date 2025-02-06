import { Request, Response, NextFunction } from 'express';
import { GitHubAPIError } from './types';
import { ProjectItemStatus } from '../../utils/github/types';

// Rate limiting
const RATE_LIMIT = 60; // requests per minute
const requestCounts = new Map<string, number>();
const requestTimestamps = new Map<string, number>();

export function rateLimit() {
    return (req: Request, _res: Response, next: NextFunction) => {
        const clientId = req.headers['x-agent-id'] as string || req.ip;
        const now = Date.now();
        const windowStart = now - 60000; // 1 minute ago

        // Clean up old timestamps
        const timestamp = requestTimestamps.get(clientId) || 0;
        if (timestamp < windowStart) {
            requestCounts.delete(clientId);
            requestTimestamps.delete(clientId);
        }

        // Check rate limit
        const count = requestCounts.get(clientId) || 0;
        if (count >= RATE_LIMIT) {
            throw new GitHubAPIError('Too many requests', 429);
        }

        // Update counters
        requestCounts.set(clientId, count + 1);
        requestTimestamps.set(clientId, now);

        next();
    };
}

// Log requests
export function logRequest(req: Request, _res: Response, next: NextFunction) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
}

// Validate agent header
export function validateAgent(req: Request, _res: Response, next: NextFunction) {
    const agentId = req.headers['x-agent-id'];
    if (!agentId) {
        throw new GitHubAPIError('Agent header required', 401);
    }
    next();
}

// Validate issue number
export function validateIssueNumber(req: Request, _res: Response, next: NextFunction) {
    const { issueNumber } = req.params;
    if (!issueNumber || isNaN(parseInt(issueNumber))) {
        throw new GitHubAPIError('Invalid issue number', 400);
    }
    next();
}

// Validate project number
export function validateProjectNumber(req: Request, _res: Response, next: NextFunction) {
    const { projectNumber } = req.params;
    if (!projectNumber || isNaN(parseInt(projectNumber))) {
        throw new GitHubAPIError('Invalid project number', 400);
    }
    next();
}

// Validate issue type
export function validateIssueType(req: Request, _res: Response, next: NextFunction) {
    const { type } = req.body;
    const validTypes = ['feat', 'fix', 'docs', 'refactor'];
    if (!type || !validTypes.includes(type)) {
        throw new GitHubAPIError('Invalid issue type', 400);
    }
    next();
}

// Validate required fields
export function validateBody(requiredFields: string[]) {
    return (req: Request, _res: Response, next: NextFunction) => {
        const missingFields = requiredFields.filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            throw new GitHubAPIError(
                `Missing required fields: ${missingFields.join(', ')}`,
                400
            );
        }
        next();
    };
}

// Validate status value
export function validateStatus(req: Request, _res: Response, next: NextFunction) {
    const { status } = req.body;
    const validStatuses = Object.values(ProjectItemStatus);
    if (!status || !validStatuses.includes(status)) {
        throw new GitHubAPIError('Invalid status value', 400);
    }
    next();
}