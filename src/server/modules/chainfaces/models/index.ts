import { Connection, Model } from 'mongoose';
import createNFTModel from './nfts';
import createOwnerModel from './owners';
import createEventModel from './events';

interface Models {
    Event: Model<any>;
    NFT: Model<any>;
    Owner: Model<any>;
    [key: string]: Model<any>;
}

export default (prefix: string, db: Connection): Models => ({
    NFT: createNFTModel(prefix, db),
    Owner: createOwnerModel(prefix, db),
    Event: createEventModel(prefix, db),
});
