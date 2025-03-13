import { Express } from 'express';
import { Model } from 'mongoose';
import nfts from './nfts';
import owners from './owners';

interface Models {
    Event: Model<any>;
    NFT: Model<any>;
    Owner: Model<any>;
    [key: string]: Model<any>;
}

const routes = (app: Express, urlPrepend: string | undefined, Models: Models) => {
    const url = urlPrepend ? `/${urlPrepend}/` : `/`;
    app.use(`${url}nfts`, nfts(Models));
    app.use(`${url}owners`, owners(Models));
};

export default routes;
