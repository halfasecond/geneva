import { Connection, Model } from 'mongoose';
import createAccountModel from './accounts';
import createCMSModel from './cms';

interface Models {
    Account: Model<any>;
    CMS: Model<any>;
    [key: string]: Model<any>;
}

export default (prefix: string, db: Connection): Models => ({
    Account: createAccountModel(prefix, db),
    CMS: createCMSModel(prefix, db)
});
