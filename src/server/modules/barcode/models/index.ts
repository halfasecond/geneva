import { Connection, Model } from 'mongoose';
import createAccountModel from './accounts'
import createNFTModel from './nfts';
import createOwnerModel from './owners';
import createEventModel from './events';

interface Models {
    Account: Model<any>;
    Event: Model<any>;
    NFT: Model<any>;
    Owner: Model<any>;
    [key: string]: Model<any>;
}

export default (prefix: string, db: Connection): Models => ({
    Account: createAccountModel(prefix, db),
    NFT: createNFTModel(prefix, db),
    Owner: createOwnerModel(prefix, db),
    Event: createEventModel(prefix, db),
});
