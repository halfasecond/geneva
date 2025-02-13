import { Express } from 'express';
import { Server } from 'socket.io';
import Web3 from 'web3';
import { EventEmitter } from 'events';
import * as genevaModule from '../geneva';
import { ModuleConfig, ModuleContext } from '../index';

export async function initialize(context: ModuleContext) {
    // First initialize the base (geneva) module
    const base = await genevaModule.initialize(context);

    // Set up any additional routes, models, or services specific to chained-horse
    const { app, io, web3, emitter, config } = context;

    // Example of extending the base module with additional functionality
    app.get('/api/chained-horse/status', async (req, res) => {
        try {
            // Get the latest block from the base module's endpoint
            const blockNumber = await web3.eth.getBlockNumber();
            const block = await web3.eth.getBlock(blockNumber);
            
            // Add chained-horse specific data
            res.json({
                success: true,
                data: {
                    module: 'chained-horse',
                    blockNumber: Number(blockNumber),
                    timestamp: block.timestamp ? Number(block.timestamp) : undefined,
                    // Add more chained-horse specific status info here
                }
            });
        } catch (error) {
            console.error('Error in chained-horse status:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get chained-horse status'
            });
        }
    });

    // Return module info with combined cleanup
    return {
        name: 'chained-horse',
        cleanup: async () => {
            // First cleanup the base module
            await base.cleanup();
            
            // Then cleanup chained-horse specific resources
            console.log('Cleaned up chained-horse module');
        }
    };
}
