import { Express } from 'express';
import { CryptoKittiesModels } from '../models';
import cattributesRoutes from './cattributes';
import eventsRoutes from './events';
import familyRoutes from './family';
import nftsRoutes from './nfts';
import ownersRoutes from './owners';

const routes = (app: Express, urlPrepend: string | undefined, Models: CryptoKittiesModels) => {
    const url = urlPrepend ? `/${urlPrepend}` : '';
    app.use(`${url}/nfts`, nftsRoutes(Models));
    app.use(`${url}/owners`, ownersRoutes(Models));
    app.use(`${url}/family`, familyRoutes(Models));
    app.use(`${url}/cattributes`, cattributesRoutes());
    app.use(`${url}/events`, eventsRoutes(Models));
};

export default routes;