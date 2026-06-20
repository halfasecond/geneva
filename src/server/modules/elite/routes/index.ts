import { Express } from 'express';
import { Model } from 'mongoose';
import nfts from './nfts';
import owners from './owners';
import auth from './auth';
import save from './save';

interface Models {
    Event: Model<any>;
    NFT: Model<any>;
    Owner: Model<any>;
    [key: string]: Model<any>;
}

const routes = (app: Express, urlPrepend: string | undefined, Models: Models, web3: any) => {
    const url = urlPrepend ? `/${urlPrepend}/` : `/`;
    app.use(`${url}auth`, auth(Models));
    app.use(`${url}save`, save(Models));
    app.use(`${url}nfts`, nfts(Models, web3));
    app.use(`${url}owners`, owners(Models));
};

export default routes;