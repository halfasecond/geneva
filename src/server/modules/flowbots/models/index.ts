import { Connection, Model } from 'mongoose'
import createAccountModel from './accounts'
import createEventModel from './events'
import createMessageModel from './messages'
import createNFTModel from './nfts'
import createOwnerModel from './owners'

interface Models {
    Account: Model<any>
    Event: Model<any>
    Message: Model<any>
    NFT: Model<any>
    Owner: Model<any>
}

export default (prefix: string, db: Connection): Models => ({
    Account: createAccountModel(prefix, db),
    Event: createEventModel(prefix, db),
    Message: createMessageModel(prefix, db),
    NFT: createNFTModel(prefix, db),
    Owner: createOwnerModel(prefix, db),
});
