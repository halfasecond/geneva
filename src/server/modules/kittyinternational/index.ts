import { ModuleConfig } from '../../types/shared';
import createModels from './models';
import Routes from './routes';

const runModule = (config: Pick<ModuleConfig, 'app' | 'db'>) => {
    const Models = createModels(config.db);
    Routes(config.app, Models);
};

export default runModule;
