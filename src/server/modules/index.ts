import { ModuleFunction } from '../types/shared';
import EventEmitter from 'events'
import createWeb3Connection from '../config/web3';
// Create an event bus for broadcasting various events
import defaultModule from './geneva';
import chainedHorseModule from './chained-horse';
import chainfacesModule from './chainfaces'
import twobitbearsModule from './twobitbears'

const { PORT, WEB3_SOCKET_URL_CHAINFACES, WEB3_SOCKET_URL_TWOBITBEARS } = process.env

const modules: ModuleFunction = (app, io, web3, db) => {
    class Emitter extends EventEmitter {}
    const emitter = new Emitter()
    // Initialize default (geneva) module
    defaultModule({
        app,
        io,
        web3,
        db,
        name: '',  // no name prefix for default module endpoints
        prefix: ''  // no prefix for db tables
    });

    // Initialize chained-horse module
    chainedHorseModule({
        app,
        io,
        web3,
        db,
        name: 'chained-horse',  // adds name to server project endpoint
        prefix: 'ch',          // changed from 'horse' to 'ch' for db tables
        deployed: 13504887,      // block the contract was deployed
        increment: 10000,        // bumped from 100 to 1000 for low-activity contract
        eventsToWatch: ['Transfer'],  // events to monitor
        emitter
    });

    const chainfaceWeb3Connection = createWeb3Connection(WEB3_SOCKET_URL_CHAINFACES || '')
    chainfacesModule({ app, io, web3: chainfaceWeb3Connection, db, name: 'chainfaces', prefix: 'cf', deployed: 9314784, increment: 2500, eventsToWatch: ['Transfer'], emitter })
    const twobitbearWeb3Connection = createWeb3Connection(WEB3_SOCKET_URL_TWOBITBEARS || '')
    twobitbearsModule({ app, io, web3: twobitbearWeb3Connection, db, name: 'twobitbears', prefix: 'tbb', deployed: 13385399, increment: 1000, eventsToWatch: ['Transfer'], emitter })

    runEventsBus(web3, emitter)
};

const runEventsBus = (web3, emitter) => {
    // Subscribe to new Ethereum block headers
    const subscribeToNewBlocks = async () => {
        try {
            const subscription = await web3.eth.subscribe('newHeads')
            subscription.on('data', (blockHeader) => {
                emitter.emit('newEthBlock', blockHeader)
            })
            subscription.on('error', (error) => console.error('Error in block header subscription:', error))
        } catch (error) {
            console.error('Failed to subscribe to new blocks:', error);
        }
    }
    subscribeToNewBlocks()
}

export default modules;
