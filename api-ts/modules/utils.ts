import { Model } from 'mongoose';

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
    };
    Models: Models;
    deployed: number;
    increment: number;
    logEvent: (event: any) => Promise<void>;
}

export const getContractHistory = async (name: string, Module: Module, eventIncludes: string[], web3: any) => {
    const { Contracts, Models, deployed, increment, logEvent } = Module;
    console.log('Starting contract history scan:', {
        name,
        contract: Contracts.Core.addr,
        deployed,
        increment,
        events: eventIncludes
    });
    
    await Promise.all(Object.keys(Contracts).map(async (contractName) => {
        if (contractName === 'Core') { // Only listen to "Core" events
            const events = await getPastContractEvents(
                `${name}`,
                Contracts[contractName].abi,
                Contracts[contractName].addr,
                deployed,
                increment,
                Models,
                logEvent,
                eventIncludes,
                web3
            );
            subscribeToContractEvents(name, Contracts.Core.abi, Contracts.Core.addr, logEvent, eventIncludes, web3);
        }
    }));
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
            _events.forEach(event => {
                pastEvents.push({ ...event, event: eventName });
            });
        } catch (error) {
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
    let latestEvent = await Event.findOne(query, {}, { sort: { 'blockNumber': -1 } });
    let fromBlockNumber = latestEvent ? latestEvent.blockNumber + 1 : fromBlock;
    let currentBlockHeight = await web3.eth.getBlockNumber();
    let toBlockNumber = Math.min(fromBlockNumber + (increment - 1), Number(currentBlockHeight));
    while (fromBlockNumber <= currentBlockHeight) {
        let pastEvents = await getPastEvents(abi, addr, fromBlockNumber, toBlockNumber, eventIncludes, web3);
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
        const currentBlockNumber = await web3.eth.getBlockNumber();
        const perc = ((100 / (Number(currentBlockNumber) - fromBlock)) * (toBlockNumber - fromBlock)).toFixed(3);
        console.log(`Retrieved ${pastEvents.length} ${name} events from block ${fromBlockNumber} - ${toBlockNumber}: ${perc}%`);
        fromBlockNumber = toBlockNumber + 1;
        toBlockNumber = Math.min(toBlockNumber + increment, Number(currentBlockHeight));
        await new Promise(resolve => setTimeout(resolve, 500)); // Don't spam the socket...
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
            await new Models.NFT(_event).save();
            await Models.Owner.findOneAndUpdate(
                { address: _event.to },
                { $inc: { balance: 1 } },
                { upsert: true }
            ).exec();
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
    await _Event.save();
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
