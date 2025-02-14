import { Express } from 'express';
import { Model } from 'mongoose';
import auth from './auth';
import cms from './cms';
import contact from './contact';
import createGitHubRouter from './github';


interface Models {
    CMS: Model<any>;
    [key: string]: Model<any>;
}

const routes = (app: Express, urlPrepend: string | undefined, Models: Models): void => {
    const url = urlPrepend ? `/${urlPrepend}/` : `/`;
    app.use(`${url}github`, createGitHubRouter());
    app.use(`${url}auth`, auth(Models));
    app.use(`${url}cms`, cms(Models));
    app.use(`${url}contact`, contact());
};

export default routes;
