import { Connection, Model } from 'mongoose';
import createNFTModel from './nfts';
import createOwnerModel from './owners';
import createEventModel from './events';
import createAccountModel from './accounts';
import createPlayerStateModel from './playerState';
import createSaveModel from './save';

interface Models {
    Event: Model<any>;
    NFT: Model<any>;
    Owner: Model<any>;
    Account: Model<any>;
    PlayerState: Model<any>;
    Save: Model<any>;
    [key: string]: Model<any>;
}

export default (prefix: string, db: Connection): Models => ({
    NFT: createNFTModel(prefix, db),
    Owner: createOwnerModel(prefix, db),
    Event: createEventModel(prefix, db),
    Account: createAccountModel(prefix, db),
    PlayerState: createPlayerStateModel(prefix, db),
    Save: createSaveModel(prefix, db),
});