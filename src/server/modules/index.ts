import { Express } from 'express';
import { Server } from 'socket.io';
import { EventEmitter } from 'events';

interface ModuleConfig {
    prefix: string;
}

interface ModuleContext {
    app: Express;
    io: Server;
    emitter: EventEmitter;
    config: ModuleConfig;
}

interface ModuleInstance {
    name: string;
    cleanup: () => Promise<void>;
}

const modules: ModuleInstance[] = [];

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
