import { ModuleConfig } from '../../types/shared';
import createModels from './models';
import Routes from './routes';
import Socket from './socket';
import { startDailyMidnightJob } from './midnight';

const runModule = (config: ModuleConfig) => {
    const { app, io, db, emitter } = config;
    const Models = createModels(db);
    Routes(app, Models, db);
    Socket(io, Models, db, emitter);
    startDailyMidnightJob(emitter, db);
};

export default runModule;
