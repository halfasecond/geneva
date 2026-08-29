import { ModuleConfig } from '../../types/shared';
import createModels from './models';
import createNewsModels from '../kittynews/models';
import Routes from './routes';
import Socket from './socket';

const runModule = (config: ModuleConfig) => {
    const { app, io, db, emitter } = config;
    const Models = createModels(db);
    const newsModels = createNewsModels(db);
    Routes(app, Models, db);
    Socket(io, Models, newsModels, db, emitter);
};

export default runModule;
