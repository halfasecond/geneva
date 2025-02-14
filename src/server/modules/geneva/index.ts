import { Model } from 'mongoose';
import { ModuleConfig, Models } from '../../types/shared.js';
import _Models from './models/index.js';
import Routes from './routes/index.js';
// import Socket from './socket';

const runModule = (config: ModuleConfig) => {
    const { app, db, name, prefix } = config;
    const Models = _Models(prefix, db);
    Routes(app, name, Models);
    // Socket(io, web3, name ? name : '', Models);
};

export default runModule;
