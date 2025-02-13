import { Express } from 'express';
import { Server } from 'socket.io';
import Web3 from 'web3';
import { EventEmitter } from 'events';
import * as genevaModule from './geneva';
import * as chainedHorseModule from './chained-horse';

interface ModuleConfig {
    prefix: string;
    web3SocketUrl: string;
}

interface ModuleContext {
    app: Express;
    io: Server;
    web3: Web3;
    emitter: EventEmitter;
    config: ModuleConfig;
}

interface ModuleInstance {
    name: string;
    cleanup: () => Promise<void>;
}

const modules: ModuleInstance[] = [];

export async function initializeModules(context: ModuleContext) {
    try {
        // Initialize geneva (base) module
        const geneva = await genevaModule.initialize(context);
        modules.push(geneva);

        console.log(`🐎 Initialized module: ${geneva.name}`);
        
        // Initialize additional modules if enabled
        if (process.env.ENABLE_CHAINED_HORSE === 'true') {
            const chainedHorse = await chainedHorseModule.initialize(context);
            modules.push(chainedHorse);
            console.log(`🐎 Initialized module: ${chainedHorse.name}`);
        }

    } catch (error) {
        console.error('Failed to initialize modules:', error);
        throw error;
    }
}

export async function cleanupModules() {
    for (const module of modules) {
        try {
            await module.cleanup();
            console.log(`🐎 Cleaned up module: ${module.name}`);
        } catch (error) {
            console.error(`Failed to cleanup module ${module.name}:`, error);
        }
    }
    modules.length = 0; // Clear the modules array
}

export { ModuleConfig, ModuleContext };
