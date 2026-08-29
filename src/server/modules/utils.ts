import { Model } from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const { VITE_ENABLE_INDEXER } = process.env

interface Models {
    Event: Model<any>;
    NFT: Model<any>;
    Owner: Model<any>;
}

interface Module {
    Contracts: {
        Core: {
            abi: any[];
            addr: string;
        };
        PurrClaim: {
            abi: any[];
            addr: string;
        };
    };
    Models: Models;
    deployed: number;
    increment: number;
    logEvent: (event: any) => Promise<void>;
}

export const getContractHistory = async (name: string, Module: Module, eventIncludes: string[], web3: any) => {
    const { Contracts, Models, deployed, increment, logEvent } = Module;
    if (VITE_ENABLE_INDEXER === 'true') {
        await Promise.all(Object.keys(Contracts).map(async (contractName) => {
            console.log('Starting contract history scan:', {
                name,
                contract: Contracts[contractName].addr,
                deployed,
                increment,
                events: contractName === 'Core' ? eventIncludes : ['Claim']
            });
            const _eventIncludes = contractName === 'Core' ? eventIncludes : ['Claim']
            const events = await getPastContractEvents(
                `${name}`,
                Contracts[contractName].abi,
                Contracts[contractName].addr,
                deployed,
                increment,
                Models,
                logEvent,
                _eventIncludes,
                web3
            );
            console.log(`${name} events indexed - switching to contract subscription`)
        }));
        Object.keys(Contracts).map(async (contractName) => {
            const _eventIncludes = contractName === 'Core' ? eventIncludes : ['Claim']
            subscribeToContractEvents(name, Contracts[contractName].abi, Contracts[contractName].addr, logEvent, _eventIncludes, web3);
        })
    } else {
        console.log(`${name} events not indexed - switching to contract subscription`)
        subscribeToContractEvents(name, Contracts.Core.abi, Contracts.Core.addr, logEvent, eventIncludes, web3);
    }
    
};

const getContractEvents = async (abi: any[], addr: string, web3: any) => {
    const events: Record<string, any> = {};
    const contractInstance = new web3.eth.Contract(abi, addr);

    await abi.forEach((item) => {
        if (item.type !== 'event') {
            return;
        }
        events[item.name] = contractInstance.events[item.name]();
    });
    return events;
};

export const subscribeToContractEvents = async (
    name: string,
    abi: any[],
    addr: string,
    logEvent: (event: any) => Promise<void>,
    eventIncludes: string[],
    web3: any
) => {
    let events = await getContractEvents(abi, addr, web3);
    for (const eventName in events) {
        if (eventIncludes.includes(eventName)) {
            events[eventName].on('data', async (event: any) => {
                console.log(`Retrieved ${name} ${event.event} event`);
                await logEvent(event);
            });
        }
    }
};

const isLogRangeError = (error: unknown): boolean => {
    const msg = error instanceof Error ? error.message : String(error);
    return /limited to a \d+ range|eth_getLogs is limited|too many|query returned more/i.test(msg);
};

const getPastEvents = async (abi: any[], address: string, fromBlock: number, toBlock: number, eventIncludes: string[], web3: any) => {
    const contract = new web3.eth.Contract(abi, address);
    const pastEvents: any[] = [];
    
    for (const eventName of eventIncludes) {
        try {
            const _events = await contract.getPastEvents(eventName, { 
                fromBlock: fromBlock, 
                toBlock: toBlock,
                filter: {} // Add empty filter to ensure we get all events
            });
            _events.forEach((event: any) => {
                pastEvents.push({ ...event, event: eventName });
            });
        } catch (error) {
            if (isLogRangeError(error)) throw error;
            console.error('Error querying events:', error);
        }
    }
    
    return pastEvents;
};

export const getPastContractEvents = async (
    name: string,
    abi: any[],
    addr: string,
    fromBlock: number,
    increment: number,
    Models: Models,
    logEvent: (event: any) => Promise<void>,
    eventIncludes: string[],
    web3: any,
    query: Record<string, any> = {}
) => {
    const { Event } = Models;
    const maxRange = Math.max(1, Number(process.env.GETLOGS_MAX_RANGE ?? 5));
    let window = Math.min(increment, maxRange);
    let latestEvent = await Event.findOne(query, {}, { sort: { 'blockNumber': -1 } });
    let fromBlockNumber = latestEvent ? latestEvent.blockNumber + 1 : fromBlock;
    let currentBlockHeight = Number(await web3.eth.getBlockNumber());
    while (fromBlockNumber <= currentBlockHeight) {
        const toBlockNumber = Math.min(fromBlockNumber + window - 1, currentBlockHeight);
        let pastEvents: any[] = [];
        try {
            pastEvents = await getPastEvents(abi, addr, fromBlockNumber, toBlockNumber, eventIncludes, web3);
        } catch (error) {
            if (window > 1 && isLogRangeError(error)) {
                window = Math.max(1, Math.floor(window / 2));
                console.warn(`[indexer] ${name} shrinking getLogs window to ${window}`);
                continue;
            }
            console.error('Error querying events:', error);
            throw error;
        }
        pastEvents.sort((a, b) => {
            const aBlockNumber = Number(a.blockNumber);
            const bBlockNumber = Number(b.blockNumber);

            const blockComparison = aBlockNumber - bBlockNumber;
            if (blockComparison === 0) {
                const aLogIndex = Number(a.logIndex);
                const bLogIndex = Number(b.logIndex);
                const logIndexComparison = aLogIndex - bLogIndex;
                return logIndexComparison > 0 ? 1 : (logIndexComparison < 0 ? -1 : 0);
            }
            return blockComparison > 0 ? 1 : -1;
        });

        for (let event of pastEvents) {
            try {
                await logEvent(event);
            } catch (error) {
                console.error(`Error processing event:`, error);
            }
        }
        currentBlockHeight = Number(await web3.eth.getBlockNumber());
        console.log(`Retrieved ${pastEvents.length} ${name} events from block ${fromBlockNumber} - ${toBlockNumber}`);
        fromBlockNumber = toBlockNumber + 1;
        window = Math.min(increment, maxRange);
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    return `${name} events up to date`;
};

export const handleStandardERC721Event = async (
    event: any,
    processEvent: ((event: any, web3: any) => Promise<void>) | undefined,
    Models: Models,
    web3: any
) => {
    const _event: any = {
        logIndex: Number(event.logIndex),
        transactionIndex: Number(event.transactionIndex),
        transactionHash: event.transactionHash,
        blockHash: event.blockHash,
        blockNumber: Number(event.blockNumber),
        address: event.address,
        id: event.id,
        signature: event.signature,
        data: event.raw && event.raw.data ? event.raw.data : event.data,
        topics: event.raw && event.raw.topics ? event.raw.topics : event.topics,
    };

    if (event.returnValues.tokenId !== undefined && event.returnValues.tokenId !== null) { _event.tokenId = Number(event.returnValues.tokenId); }
    if (event.returnValues.from) { _event.from = event.returnValues.from.toLowerCase(); }
    if (event.returnValues.to) { _event.to = event.returnValues.to.toLowerCase(); }
    if (event.returnValues.owner) { _event.owner = event.returnValues.owner; }
    if (event.returnValues.operator) { _event.owner = event.returnValues.operator; }
    if (event.returnValues.approved) { _event.approved = event.returnValues.approved; }
    
    try {
        const block = await web3.eth.getBlock(_event.blockNumber);
        _event.multtamp = Number(block.timestamp);
    } catch (error) {
        console.error('Error getting block timestamp:', error);
    }

    const alreadyLogged = await Models.Event.findOne({
        transactionHash: _event.transactionHash,
        logIndex: _event.logIndex,
    }).exec();
    if (alreadyLogged) {
        return;
    }

    if (event.event === "Transfer") {
        console.log('Processing Transfer:', {
            from: _event.from,
            to: _event.to,
            tokenId: _event.tokenId
        });

        if (_event.from === '0x0000000000000000000000000000000000000000') {
            _event.owner = _event.to;
            _event.owners = [_event.to];
            if (processEvent) {
                await processEvent(_event, web3);
            }
            const existing = await Models.NFT.findOne({ tokenId: _event.tokenId }).exec();
            if (!existing) {
                await new Models.NFT(_event).save();
                await Models.Owner.findOneAndUpdate(
                    { address: _event.to },
                    { $inc: { balance: 1 } },
                    { upsert: true }
                ).exec();
            }
        } else {
            if (_event.from !== '0x0000000000000000000000000000000000000000') {
                try {
                    await Models.NFT.findOneAndUpdate(
                        { tokenId: _event.tokenId },
                        { owner: _event.to, $addToSet: { owners: _event.to } },
                        { upsert: false }
                    ).exec();
                    await Models.Owner.findOneAndUpdate(
                        { address: _event.from },
                        { $inc: { balance: -1 } },
                        { upsert: false }
                    ).exec();
                    await Models.Owner.findOneAndUpdate(
                        { address: _event.to },
                        { $inc: { balance: 1 } },
                        { upsert: true }
                    ).exec();
                } catch (e) {
                    console.error('Error updating NFT/Owner:', e);
                }
            }
        }
    }
    _event.event = event.event;
    const _Event = new Models.Event(_event);
    try {
        await _Event.save();
    } catch (error: any) {
        if (error?.code === 11000) {
            return;
        }
        throw error;
    }
};

export const bulkLogEvents = async (events: any[], Models: Models) => {
    const bulkOps = events.map(event => ({ insertOne: { document: event }}));
    try {
        await Models.Event.bulkWrite(bulkOps);
    } catch (error: any) {
        if (error.code === 11000) {
            console.error(`Event already logged... skipping...`);
        } else {
            console.error(`Bulk insert error: ${error}`);
            process.exit(0);
        }
    }
};
