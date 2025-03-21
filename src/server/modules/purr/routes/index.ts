import { Express } from 'express';
import { Model } from 'mongoose';
import auth from './auth'
import balances from './balances';
import claims from './claims';
import events from './events';

interface Models {
    Account: Model<any>;
    Event: Model<any>;
    Balance: Model<any>;
    Claim: Model<any>;
    [key: string]: Model<any>;
}

const routes = (app: Express, urlPrepend: string | undefined, Models: Models) => {
    const url = urlPrepend ? `/${urlPrepend}/` : `/`;
    app.use(`${url}auth`, auth(Models));
    app.use(`${url}balances`, balances(Models));
    app.use(`${url}claims`, claims(Models));
    app.use(`${url}events`, events(Models));
};

export default routes;
