import { Connection, Model } from 'mongoose';
import createAccountModel from './accounts';
import createAquariumModel from './aquarium';
import createCMSModel from './cms';
import createMessageModel from './messages';

interface Models {
    Account: Model<any>;
    Aquarium: Model<any>;
    CMS: Model<any>;
    Message: Model<any>;
    [key: string]: Model<any>;
}

export default (prefix: string, db: Connection): Models => ({
    Account: createAccountModel(prefix, db),
    Aquarium: createAquariumModel(prefix, db),
    CMS: createCMSModel(prefix, db),
    Message: createMessageModel(prefix, db)
});
