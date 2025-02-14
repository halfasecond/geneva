import { Response } from 'express';
import { GitHubAPIError } from './types.js';

export function sendSuccessResponse(res: Response, data: any) {
    res.json({
        success: true,
        data
    });
}

export const asyncHandler = (fn: Function) => (req: any, res: Response, next: Function) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
        if (error instanceof GitHubAPIError) {
            res.status(error.statusCode).json({
                success: false,
                error: {
                    message: error.message,
                    details: error.details
                }
            });
        } else {
            console.error('Unhandled error:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: error instanceof Error ? error.message : 'Internal server error'
                }
            });
        }
    });
};
