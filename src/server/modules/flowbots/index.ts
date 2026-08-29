import { ModuleConfig } from '../../types/shared';
import _Models from './models'
import Routes from './routes'
import Contracts from './contracts'
import { handleStandardERC721Event } from '../utils'
import { followContracts } from '../../indexer'
import { makeBot } from './utils'

const processEvent = (event: any, _web3: any) => {
    const bot = makeBot(event.tokenId - 1)
    return bot
}
const logEvent = async (event: any, Models: any, web3: any) => handleStandardERC721Event(event, processEvent, Models, web3)

const runModule = (config: ModuleConfig) => {
    const { app, db, name, prefix, deployed = 0, eventsToWatch = ['Transfer'], increment = 100, web3, emitter, watchContract } = config;
    const _prefix = prefix ? prefix : ''
    const Models = _Models(_prefix, db);
    Routes(app, name, Models);

    return followContracts({
        name: name || 'flowbots',
        watchContract,
        contracts: [{ abi: Contracts.Core.abi, addr: Contracts.Core.addr, events: eventsToWatch }],
        handle: async (event: any) => {
            await logEvent(event, Models, web3)
            emitter.emit('flowbotsEvent', event)
        },
        backfill: { web3, Models, deployed, increment },
    });
};

export default runModule
