import { Express } from 'express';
import { Model } from 'mongoose';
import auth from './auth';
import contact from './contact';
import tanks from './tanks'


export interface Models {
    CMS: Model<any>;
    Account: Model<any>;
    [key: string]: Model<any>;
}

const routes = (app: Express, urlPrepend: string | undefined, Models: Models): void => {
    const url = urlPrepend ? `/${urlPrepend}/` : `/`;
    console.log(url)
    app.use(`${url}auth`, auth(Models));
    app.use(`${url}contact`, contact());
    app.use(`${url}tanks`, tanks(Models));
};

export default routes;
