import { ModuleConfig } from '../../types/shared';
import Contracts from './contracts';
import { getCryptoKittiesContractHistory } from './indexer';
import createModels from './models';
import { processCryptoKittiesEvent } from './processEvent';
import Routes from './routes';

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
    } = config;

    const Models = createModels(prefix, db);
    Routes(app, name, Models);

    getCryptoKittiesContractHistory(
        name || 'cryptokitties',
        {
            Contracts,
            Models,
            deployed,
            increment,
            logEvent: (event) => processCryptoKittiesEvent(event, Models, web3, emitter),
        },
        eventsToWatch,
        web3,
    ).catch((error) => {
        console.error('cryptokitties indexer failed to start:', error);
    });
};

export default runModule;