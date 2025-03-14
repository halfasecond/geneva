import { Response } from 'express';
import { GitHubAPIError } from './types';

export function asyncHandler(fn: Function) {
    return async function(req: any, res: any, next: any) {
        try {
            await fn(req, res, next);
        } catch (error) {
            console.error('Error in async handler:', error);
            
            // Set JSON content type for all error responses
            res.setHeader('Content-Type', 'application/json');
            
            if (error instanceof GitHubAPIError) {
                res.status(error.statusCode).json({
                    success: false,
                    error: {
                        message: error.message,
                        details: error.details
                    }
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: {
                        message: error instanceof Error ? error.message : 'Internal server error'
                    }
                });
            }
        }
    };
}

export function sendSuccessResponse<T>(res: Response, data: T) {
    res.setHeader('Content-Type', 'application/json');
    res.json({
        success: true,
        data
    });
}