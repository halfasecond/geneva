import { Express } from 'express';
import { Server } from 'socket.io';
import { Connection } from 'mongoose';
import _Models from './models';
import Routes from './routes';
import Contracts from './contracts';
import { getContractHistory } from '../utils';

interface ModuleConfig {
    app: Express;
    io: Server;
    web3: any;
    db: Connection;
    name?: string;
    prefix: string;
    deployed?: number;
    increment?: number;
    eventsToWatch?: string[];
    emitter: any;
}

const processTransferEvent = async (event: any, web3: any): Promise<void> => {
    const { from, to, value } = event.returnValues;
    event.from = from;
    event.to = to;
    event.amount = value;
};

const processClaimEvent = async (event: any, web3: any): Promise<void> => {
    const { claimer, amount } = event.returnValues;
    event.from = '0x0000000000000000000000000000000000000000';
    event.to = claimer;
    event.amount = amount;
};

const logEvent = async (event: any, Models: Models, web3: any) => {
    try {
        const processor = event.event === 'Transfer' ? processTransferEvent : processClaimEvent;
        await processor(event, web3);

        // Save event with explicit Number conversion for blockNumber
        const newEvent = new Models.Event({
            contract: event.address,
            event: event.event,
            transactionHash: event.transactionHash,
            blockNumber: Number(event.blockNumber), // Explicit conversion here
            from: event.from.toLowerCase(),
            to: event.to.toLowerCase(),
            amount: event.amount,
            timestamp: new Date()
        });
        await newEvent.save();

        // Update balances
        if (event.from !== '0x0000000000000000000000000000000000000000') {
            const fromBalance = await Models.Balance.findOne({ address: event.from.toLowerCase() });
            if (fromBalance) {
                const newBalance = BigInt(fromBalance.balance) - BigInt(event.amount);
                fromBalance.balance = newBalance.toString();
                fromBalance.lastUpdated = new Date();
                await fromBalance.save();
            }
        }

        if (event.to !== '0x0000000000000000000000000000000000000000') {
            let toBalance = await Models.Balance.findOne({ address: event.to.toLowerCase() });
            if (!toBalance) {
                toBalance = new Models.Balance({
                    address: event.to.toLowerCase(),
                    balance: '0'
                });
            }
            const newBalance = BigInt(toBalance.balance) + BigInt(event.amount);
            toBalance.balance = newBalance.toString();
            toBalance.lastUpdated = new Date();
            await toBalance.save();
        }

        // If it's a claim event, update claim status
        if (event.event === 'TokensClaimed') {
            const claim = new Models.Claim({
                address: event.to.toLowerCase(),
                claimed: true,
                amount: event.amount,
                timestamp: new Date()
            });
            await claim.save();
        }
    } catch (error) {
        console.error('Error processing event:', error);
    }
};

const runModule = (config: ModuleConfig) => {
    const { app, io, web3, db, name, prefix, deployed = 0, increment = 1000, eventsToWatch = ['Transfer', 'TokensClaimed'], emitter } = config;
    const Models = _Models(prefix, db);

    Routes(app, name, Models);

    if (Object.keys(Contracts).length) {
        const module = { 
            Contracts, 
            Models, 
            deployed, 
            increment, 
            eventsToWatch, 
            logEvent: (event: any) => logEvent(event, Models, web3) 
        };
        getContractHistory(name || 'default module', module, eventsToWatch, web3);
    } else {
        console.log('no contract found to observe');
    }
};

export default runModule;
