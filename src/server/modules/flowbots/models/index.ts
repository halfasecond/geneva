import createAccountModel from './accounts'
import createEventModel from './events'
import createMessageModel from './messages'
import createNFTModel from './nfts'
import createOwnerModel from './owners'

export default (prefix: string, db: Connection): Models => ({
    Account: createAccountModel(prefix, db),
    Event: createEventModel(prefix, db),
    Message: createMessageModel(prefix, db),
    NFT: createNFTModel(prefix, db),
    Owner: createOwnerModel(prefix, db),
});
