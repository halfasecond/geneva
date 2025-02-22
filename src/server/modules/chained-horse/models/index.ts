import { Connection, Model } from 'mongoose';
import createNFTModel from './nfts';
import createOwnerModel from './owners';
import createEventModel from './events';
import createAccountModel from './accounts';
import createMessageModel from './messages';
import createGameStateModel from './gameState';

interface Models {
    Event: Model<any>;
    NFT: Model<any>;
    Owner: Model<any>;
    Account: Model<any>;
    Message: Model<any>;
    GameState: Model<any>;
    [key: string]: Model<any>;
}

export default (prefix: string, db: Connection): Models => ({
    NFT: createNFTModel(prefix, db),
    Owner: createOwnerModel(prefix, db),
    Event: createEventModel(prefix, db),
    Account: createAccountModel(prefix, db),
    Message: createMessageModel(prefix, db),
    GameState: createGameStateModel(prefix, db)
});
