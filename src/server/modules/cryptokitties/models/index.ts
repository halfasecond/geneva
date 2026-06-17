import { Connection, Model } from 'mongoose';
import createEventModel from './events';
import createNFTModel from './nfts';
import createOwnerModel from './owners';

export interface CryptoKittiesModels {
    Event: Model<Record<string, unknown>>;
    NFT: Model<Record<string, unknown>>;
    Owner: Model<Record<string, unknown>>;
    [key: string]: Model<Record<string, unknown>>;
}

export default (prefix: string, db: Connection): CryptoKittiesModels => ({
    Event: createEventModel(prefix, db),
    NFT: createNFTModel(prefix, db),
    Owner: createOwnerModel(prefix, db),
});