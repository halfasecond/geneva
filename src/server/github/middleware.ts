import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ProjectItemStatus } from '../../utils/github/types';

// Rate limiting configuration
const WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS = 60; // 60 requests per minute

// Store request counts and timestamps per client
const requestCounts = new Map<string, number>();
const requestTimestamps = new Map<string, number>();

export const validateAgent: RequestHandler = (req, res, next) => {
    const agentId = req.headers['x-agent-id'];
    if (!agentId || typeof agentId !== 'string') {
        res.status(400).json({ error: 'Missing or invalid x-agent-id header' });
        return;
    }
    next();
};

export const validateBody: RequestHandler = (req, res, next) => {
    if (!req.body) {
        res.status(400).json({ error: 'Missing request body' });
        return;
    }
    next();
};

export const validateIssueNumber: RequestHandler = (req, res, next) => {
    const issueNumber = parseInt(req.params.issueNumber);
    if (isNaN(issueNumber)) {
        res.status(400).json({ error: 'Invalid issue number' });
        return;
    }
    next();
};

export const validateProjectNumber: RequestHandler = (req, res, next) => {
    const projectNumber = parseInt(req.params.projectNumber);
    if (isNaN(projectNumber)) {
        res.status(400).json({ error: 'Invalid project number' });
        return;
    }
    next();
};

export const validateIssueType: RequestHandler = (req, res, next) => {
    const { type } = req.body;
    if (!type || typeof type !== 'string') {
        res.status(400).json({ error: 'Invalid issue type' });
        return;
    }
    next();
};

export const validateStatus: RequestHandler = (req, res, next) => {
    const { status } = req.body;
    if (!status || !Object.values(ProjectItemStatus).includes(status)) {
        res.status(400).json({ error: 'Invalid status' });
        return;
    }
    next();
};

export const validatePullRequestNumber: RequestHandler = (req, res, next) => {
    const prNumber = parseInt(req.params.pullNumber);
    if (isNaN(prNumber)) {
        res.status(400).json({ error: 'Invalid pull request number' });
        return;
    }
    next();
};

export const validateDiscussionNumber: RequestHandler = (req, res, next) => {
    const discussionNumber = parseInt(req.params.discussionNumber);
    if (isNaN(discussionNumber)) {
        res.status(400).json({ error: 'Invalid discussion number' });
        return;
    }
    next();
};

export const logRequest: RequestHandler = (req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
};

export const rateLimiter: RequestHandler = (req, res, next) => {
    try {
        const clientId = req.headers['x-agent-id'];
        if (!clientId || typeof clientId !== 'string') {
            res.status(400).json({ error: 'Missing or invalid x-agent-id header' });
            return;
        }

        const now = Date.now();
        const timestamp = requestTimestamps.get(clientId) ?? 0;

        if (now - timestamp >= WINDOW_MS) {
            requestCounts.delete(clientId);
            requestTimestamps.delete(clientId);
        }

        const count = requestCounts.get(clientId) ?? 0;

        if (count >= MAX_REQUESTS) {
            res.status(429).json({ error: 'Too many requests' });
            return;
        }

        requestCounts.set(clientId, count + 1);
        requestTimestamps.set(clientId, now);

        next();
    } catch (error) {
        console.error('Rate limiter error:', error);
        next(error);
    }
};