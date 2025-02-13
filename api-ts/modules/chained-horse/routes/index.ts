import { Express } from 'express';
import { Model } from 'mongoose';
import auth from './auth';
import nfts from './nfts';
import owners from './owners';

interface Models {
    Account: Model<any>;
    NFT: Model<any>;
    Owner: Model<any>;
    Event: Model<any>;
}

const routes = (app: Express, urlPrepend: string | undefined, Models: Models) => {
    const url = urlPrepend ? `/${urlPrepend}-` : `/`;
    app.use(`${url}auth`, auth(Models));
    app.use(`${url}nfts`, nfts(Models));
    app.use(`${url}owners`, owners(Models));
};

export default routes;
