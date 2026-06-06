import { Model } from 'mongoose'
 
import authRoutes from './auth'
import nftsRoutes from './nfts'
import ownersRoutes from './owners'

export interface Models {
    CMS: Model<any>;
    Account: Model<any>;
    [key: string]: Model<any>;
}

const routes = (app, urlPrepend, Models, db) => {
    const url = urlPrepend ? `/${urlPrepend}` : ``
    app.use(`${url}/auth`, authRoutes(Models))
    app.use(`${url}/nfts`, nftsRoutes(Models))
    app.use(`${url}/owners`, ownersRoutes(Models, db))
}

export default routes
