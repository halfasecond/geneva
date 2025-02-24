import { ModuleConfig } from '../../types/shared';
import _Models from './models';
import Routes from './routes';
// import Socket from './socket';

const runModule = (config: ModuleConfig) => {
    const { app, db, name } = config;
    const Models = _Models('', db);
    Routes(app, name, Models);
    // Socket(io, web3, name ? name : '', Models);
};

export default runModule;
