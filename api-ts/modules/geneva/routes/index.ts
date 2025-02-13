import { Express } from 'express';
import { Model } from 'mongoose';
import createGitHubRouter from './github/index.js';

interface Models {
    Account: Model<any>;
    CMS: Model<any>;
    [key: string]: Model<any>;
}

const routes = (app: Express, urlPrepend: string | undefined, Models: Models) => {
    const url = urlPrepend ? `/${urlPrepend}-` : `/`;
    
    // Basic health check route
    app.get(`${url}health`, (req, res) => {
        res.json({ status: 'ok' });
    });

    // Mount GitHub routes
    app.use(`${url}github`, createGitHubRouter());
};

export default routes;
