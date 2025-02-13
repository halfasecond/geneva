import { Express as BaseExpress } from 'express';

// Just re-export the Express type and use type assertions where needed
export type Express = BaseExpress;

// Re-export other Express types that we might need
export {
    Request,
    Response,
    NextFunction,
    Router
} from 'express';
