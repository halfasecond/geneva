import _Models from './models'
import Routes from './routes'
import Contracts from './contracts'
// import Socket from './socket'
import { getContractHistory, handleStandardERC721Event } from '../utils'
import { makeBot } from './utils'

const processEvent = (event, web3) => {
    const bot = makeBot(event.tokenId - 1)
    return bot
}
const logEvent = async (event, Models, web3) => handleStandardERC721Event(event, processEvent, Models, web3)

// const runModule = ({ app, io, web3, name, prefix, deployed, increment, eventsToWatch, db, emitter }) => {
//     const Models = {}
//     Object.keys(_Models).map((m, i) => {
//         Models[m] = _Models[m](prefix)
//         if (i === Object.keys(_Models).length - 1) {
//             Routes(app, name, Models, db)
//             Socket(io, web3, name, Models, db, emitter)
//             const module = { Contracts, Models, deployed, increment, eventsToWatch, logEvent: async event => {
//                 await logEvent(event, Models, web3)
//                 emitter.emit('flowbotsEvent', event)
//             } }
//             getContractHistory(name, module, eventsToWatch, web3, emitter)
//         }
//     })
// }

const runModule = (config: ModuleConfig) => {
    const { app, db, name, prefix, deployed, eventsToWatch, increment, io, web3, emitter } = config;
    const _prefix = prefix ? prefix : ''
    const Models = _Models(_prefix, db);
    Routes(app, name, Models);
    // Socket(io, web3, name ? name : '', Models, emitter);

    if (Object.keys(Contracts).length) {
        const module = { 
            Contracts, 
            Models, 
            deployed, 
            increment, 
            eventsToWatch, 
            logEvent: async (event: any) => {
                await logEvent(event, Models, web3)
                emitter.emit('flowbotsEvent', event)
            }
        }
        getContractHistory(name || 'default module', module, eventsToWatch, web3);
    } else {
        console.log('no contract found to observe');
    }
};

export default runModule