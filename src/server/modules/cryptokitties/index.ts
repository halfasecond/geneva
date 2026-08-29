import { ModuleConfig } from '../../types/shared';
import { bulkLogEvents } from '../utils';
import { followContracts } from '../../indexer';
import Contracts from './contracts';
import { handleCryptoKittiesEvent, updateFloor } from './indexer';
import createModels from './models';
import { processCryptoKittiesEvent } from './processEvent';
import Routes from './routes';

const ZERO = '0x0000000000000000000000000000000000000000';
const AUCTION_EVENTS = ['AuctionCreated', 'AuctionCancelled', 'AuctionSuccessful'];

const runModule = (config: ModuleConfig) => {
    const {
        app,
        web3,
        db,
        name,
        prefix = 'ck',
        deployed = 4605346,
        increment = 10000,
        eventsToWatch = ['Transfer', 'Birth', 'Pregnant'],
        emitter,
        watchContract,
    } = config;

    const Models = createModels(prefix, db);
    Routes(app, name, Models);

    const handle = async (event: any) => {
        if (event.event === 'Transfer' && event.returnValues?.from === ZERO) {
            return;
        }
        const processed = await handleCryptoKittiesEvent(event, web3);
        await bulkLogEvents([processed], Models as any);
        if (eventsToWatch.includes(event.event)) {
            await processCryptoKittiesEvent(processed, Models, web3, emitter);
        }
    };

    void updateFloor(name || 'cryptokitties', Models, { $or: [{ sale: true }, { sire: true }] });

    return followContracts({
        name: name || 'cryptokitties',
        watchContract,
        contracts: [
            { label: 'Core', abi: Contracts.Core.abi, addr: Contracts.Core.addr, events: eventsToWatch },
            { label: 'Sale', abi: Contracts.Sale.abi, addr: Contracts.Sale.addr, events: AUCTION_EVENTS },
            { label: 'Sire', abi: Contracts.Sire.abi, addr: Contracts.Sire.addr, events: AUCTION_EVENTS },
        ],
        handle,
        backfill: { web3, Models, deployed, increment },
    });
};

export default runModule;
