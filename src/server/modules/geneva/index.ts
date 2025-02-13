import { Express } from 'express';
import { Server } from 'socket.io';
import Web3 from 'web3';
import { EventEmitter } from 'events';

import { Numbers } from 'web3';

type BlockHeader = {
    number?: Numbers;
    timestamp?: Numbers;
    [key: string]: any;
};

// Helper to convert Web3 Numbers to regular numbers
function toNumber(value?: Numbers): number {
    if (typeof value === 'bigint') return Number(value);
    if (typeof value === 'string') return parseInt(value, 10);
    if (typeof value === 'number') return value;
    return 0; // fallback
}

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

export async function initialize(context: ModuleContext) {
    const { app, io, web3, emitter, config } = context;

    // Set up block number subscription
    const subscription = await web3.eth.subscribe('newBlockHeaders');
    
    subscription.on('data', async (blockHeader: BlockHeader) => {
        // Emit block number update
        emitter.emit('block:update', {
            number: toNumber(blockHeader.number),
            timestamp: toNumber(blockHeader.timestamp)
        });
        
        // Convert BigInt values to numbers for socket.io
        const socketData = {
            number: toNumber(blockHeader.number),
            timestamp: toNumber(blockHeader.timestamp)
        };

        // Emit through socket.io
        io.emit('block:update', socketData);
    });

    subscription.on('error', (error: Error) => {
        console.error('Error in block subscription:', error);
    });

    // Set up routes
    app.get('/api/geneva/block', async (req, res) => {
        try {
            const blockNumber = await web3.eth.getBlockNumber();
            const block = await web3.eth.getBlock(blockNumber);
            res.json({
                success: true,
                data: {
                    number: toNumber(block.number),
                    timestamp: toNumber(block.timestamp)
                }
            });
        } catch (error) {
            console.error('Error fetching block:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch block number'
            });
        }
    });

    return {
        name: 'geneva',
        cleanup: async () => {
            await subscription.unsubscribe();
            console.log('Successfully unsubscribed from block headers');
        }
    };
}
