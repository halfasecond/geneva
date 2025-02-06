import { Request, Response, NextFunction } from 'express';
import { GitHubAPIError } from './types';

const VALID_ISSUE_TYPES = ['feat', 'fix', 'docs', 'refactor'];
const MAX_REQUESTS_PER_MINUTE = 60;

// Validate agent header
export function validateAgent(req: Request, _res: Response, next: NextFunction) {
    const agentId = req.headers['x-agent-id'];
    if (!agentId) {
        throw new GitHubAPIError('Missing x-agent-id header', 400);
    }

    // Store agent ID for later use
    req.agent = agentId as string;
    next();
}

// Log all requests
export function logRequest(req: Request, _res: Response, next: NextFunction) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    if (req.agent) {
        console.log(`Agent: ${req.agent}`);
    }
    next();
}

// Rate limiting middleware
export function rateLimit(limit: number = MAX_REQUESTS_PER_MINUTE) {
    const requests = new Map<string, number[]>();

    return (req: Request, _res: Response, next: NextFunction) => {
        const now = Date.now();
        const minute = 60 * 1000;
        const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

        // Get existing requests for this IP
        const timestamps = requests.get(clientIp) || [];

        // Remove timestamps older than 1 minute
        const recentTimestamps = timestamps.filter(time => now - time < minute);

        if (recentTimestamps.length >= limit) {
            throw new GitHubAPIError('Too many requests', 429);
        }

        // Add current request
        recentTimestamps.push(now);
        requests.set(clientIp, recentTimestamps);

        next();
    };
}

// Validate issue number parameter
export function validateIssueNumber(req: Request, _res: Response, next: NextFunction) {
    const issueNumber = parseInt(req.params.issueNumber);
    if (isNaN(issueNumber) || issueNumber <= 0) {
        throw new GitHubAPIError('Invalid issue number', 400);
    }
    next();
}

// Validate project number parameter
export function validateProjectNumber(req: Request, _res: Response, next: NextFunction) {
    const projectNumber = parseInt(req.params.projectNumber);
    if (isNaN(projectNumber) || projectNumber <= 0) {
        throw new GitHubAPIError('Invalid project number', 400);
    }
    next();
}

// Validate issue type
export function validateIssueType(req: Request, _res: Response, next: NextFunction) {
    const { type } = req.body;
    if (!type || !VALID_ISSUE_TYPES.includes(type)) {
        throw new GitHubAPIError('Invalid issue type', 400);
    }
    next();
}

// Validate required body fields
export function validateBody(requiredFields: string[]) {
    return (req: Request, _res: Response, next: NextFunction) => {
        for (const field of requiredFields) {
            if (!req.body || req.body[field] === undefined) {
                throw new GitHubAPIError(`Missing required field: ${field}`, 400);
            }
        }
        next();
    };
}

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            agent?: string;
        }
    }
}