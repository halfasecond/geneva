import BN from 'bn.js';
import { bulkLogEvents } from '../utils';
import Contracts, { CryptoKittiesContracts } from './contracts';
import { CryptoKittiesModels } from './models';

export const calculateCurrentPrice = (startP: string, endP: string, startT: string, endT: string, now: string | number) => {
    const pad = 35;
    const startPriceBN = new BN(startP);
    const endPriceBN = new BN(endP);
    const startTimeBN = new BN(startT);
    const endTimeBN = new BN(endT);
    const nowBN = new BN(now);
    if (startPriceBN.eq(endPriceBN)) {
        return startPriceBN.toString().padStart(pad, '0');
    }
    if (nowBN.gte(endTimeBN)) {
        return endPriceBN.toString().padStart(pad, '0');
    }
    const durationBN = endTimeBN.sub(startTimeBN);
    const timeElapsedBN = nowBN.sub(startTimeBN);
    const salePercentageBN = timeElapsedBN.mul(new BN(100)).div(durationBN);
    const priceDifferenceBN = endPriceBN.sub(startPriceBN);
    const priceAdjustmentBN = salePercentageBN.mul(priceDifferenceBN).div(new BN(100));
    const currentPriceBN = startPriceBN.add(priceAdjustmentBN);
    return currentPriceBN.toString().padStart(pad, '0');
};

const updateFloor = async (name: string, Models: CryptoKittiesModels, query: Record<string, unknown>) => {
    const now = Math.floor(Date.now() / 1000);
    const cursor = Models.NFT.find(query).cursor();
    for (let nft = await cursor.next(); nft != null; nft = await cursor.next()) {
        const { startingPrice, endingPrice, auctionStart, auctionEnd } = nft;
        const currentPrice = calculateCurrentPrice(
            startingPrice as string,
            endingPrice as string,
            auctionStart!.toString(),
            auctionEnd!.toString(),
            now
        );
        if (currentPrice !== nft.currentPrice) {
            await Models.NFT.updateOne({ _id: nft._id }, { currentPrice });
        }
    }
    const nextQuery = {
        auctionEnd: { $gt: now },
        $or: [{ sale: true }, { sire: true }],
        $expr: { $ne: ['$startingPrice', '$endingPrice'] },
    };
    setTimeout(() => updateFloor(name, Models, nextQuery), 60000);
    console.log(`Processed ${name} auctions`);
};

const getContractEvents = async (abi: unknown[], addr: string, web3: any) => {
    const events: Record<string, any> = {};
    const contractInstance = new web3.eth.Contract(abi, addr);
    (abi as Array<{ type?: string; name?: string }>).forEach((item) => {
        if (item.type !== 'event' || !item.name) return;
        events[item.name] = contractInstance.events[item.name]();
    });
    return events;
};

export const handleCryptoKittiesEvent = async (event: any, web3: any) => {
    const _event: Record<string, unknown> = {
        logIndex: Number(event.logIndex),
        transactionIndex: Number(event.transactionIndex),
        transactionHash: event.transactionHash,
        blockHash: event.blockHash,
        blockNumber: Number(event.blockNumber),
        address: event.address.toLowerCase(),
        event: event.event,
    };
    const { timestamp } = await web3.eth.getBlock(_event.blockNumber);
    _event.timestamp = Number(timestamp);

    const returnValues = event.returnValues;
    if (event.event === 'Pregnant' && returnValues) {
        _event.sireId = Number(returnValues.sireId);
        _event.matronId = Number(returnValues.matronId);
        _event.cooldownEndBlock = Number(returnValues.cooldownEndBlock);
        _event.owner = returnValues.owner.toLowerCase();
    }
    if (event.event === 'Transfer' && returnValues) {
        _event.from = returnValues.from.toLowerCase();
        _event.to = returnValues.to.toLowerCase();
        _event.tokenId = Number(returnValues.tokenId);
    }
    if (event.event === 'Birth' && returnValues) {
        _event.tokenId = Number(returnValues.kittyId);
        _event.matronId = Number(returnValues.matronId);
        _event.sireId = Number(returnValues.sireId);
        _event.genes = returnValues.genes;
        _event.owner = returnValues.owner.toLowerCase();
    }
    if (event.event === 'AuctionSuccessful' && returnValues) {
        _event.tokenId = Number(returnValues.tokenId);
        _event.totalPrice = returnValues.totalPrice.toString();
        _event.winner = returnValues.winner.toLowerCase();
    }
    if (event.event === 'AuctionCreated' && returnValues) {
        _event.tokenId = Number(returnValues.tokenId);
        _event.startingPrice = returnValues.startingPrice.toString();
        _event.endingPrice = returnValues.endingPrice.toString();
        _event.duration = Number(returnValues.duration);
    }
    if (event.event === 'AuctionCancelled' && returnValues) {
        _event.tokenId = Number(returnValues.tokenId);
    }
    return _event;
};

const getPastEvents = async (
    abi: unknown[],
    address: string,
    fromBlock: number,
    toBlock: number,
    eventIncludes: string[],
    web3: any
) => {
    const contract = new web3.eth.Contract(abi, address);
    const pastEvents: any[] = [];
    for (const eventName of eventIncludes) {
        const _events = await contract.getPastEvents(eventName, { fromBlock, toBlock, address });
        _events.forEach((event: any) => pastEvents.push({ ...event, event: eventName }));
    }
    return pastEvents;
};

const sortEvents = (pastEvents: any[]) => {
    pastEvents.sort((a, b) => {
        const blockComparison = a.blockNumber - b.blockNumber;
        if (blockComparison === 0) {
            const logComparison = a.logIndex - b.logIndex;
            return logComparison > 0 ? 1 : logComparison < 0 ? -1 : 0;
        }
        return blockComparison > 0 ? 1 : -1;
    });
};

const getPastContractEvents = async (
    name: string,
    abi: unknown[],
    addr: string,
    fromBlock: number,
    increment: number,
    Models: CryptoKittiesModels,
    logEvent: (event: any) => Promise<void>,
    eventIncludes: string[],
    web3: any,
    query: Record<string, unknown> = {}
) => {
    let latestEvent = await Models.Event.findOne(query, {}, { sort: { blockNumber: -1 } });
    let fromBlockNumber = latestEvent ? (latestEvent.blockNumber as number) + 1 : fromBlock;
    console.log(`${name} indexer resuming from block ${fromBlockNumber}${latestEvent ? ' (latest event in db)' : ' (deploy block)'}`);
    const currentBlockHeight = Number(await web3.eth.getBlockNumber());
    console.log(`${name} current chain head: ${currentBlockHeight}`);
    let toBlockNumber = Math.min(fromBlockNumber + (increment - 1), currentBlockHeight);

    while (fromBlockNumber <= currentBlockHeight) {
        let pastEvents = await getPastEvents(abi, addr, fromBlockNumber, toBlockNumber, eventIncludes, web3);

        if (name === 'cryptokitties' && pastEvents.length > 0) {
            const auctionEventIncludes = ['AuctionCreated', 'AuctionCancelled', 'AuctionSuccessful'];
            const sireAuctionPastEvents = await getPastEvents(
                Contracts.Sire.abi, Contracts.Sire.addr, fromBlockNumber, toBlockNumber, auctionEventIncludes, web3
            );
            const saleAuctionPastEvents = await getPastEvents(
                Contracts.Sale.abi, Contracts.Sale.addr, fromBlockNumber, toBlockNumber, auctionEventIncludes, web3
            );
            if (sireAuctionPastEvents.length > 0) pastEvents = [...pastEvents, ...sireAuctionPastEvents];
            if (saleAuctionPastEvents.length > 0) pastEvents = [...pastEvents, ...saleAuctionPastEvents];
        }

        sortEvents(pastEvents);

        if (name === 'cryptokitties' && pastEvents.length > 0) {
            const processedEvents: any[] = [];
            for (const event of pastEvents) {
                const processedEvent = await handleCryptoKittiesEvent(event, web3);
                if (!(event.event === 'Transfer' && processedEvent.from === '0x0000000000000000000000000000000000000000')) {
                    processedEvents.push(processedEvent);
                }
            }
            if (processedEvents.length > 0) {
                await bulkLogEvents(processedEvents, Models as any);
            }
            pastEvents = processedEvents.filter(({ event }) => eventIncludes.includes(event));
        }

        for (const event of pastEvents) {
            try {
                await logEvent(event);
            } catch (error) {
                console.error(`Error processing event ${event}:`, error);
            }
        }

        const perc = ((100 / (currentBlockHeight - fromBlock)) * (toBlockNumber - fromBlockNumber)).toFixed(3);
        console.log(`Retrieved ${pastEvents.length} ${name} events from block ${fromBlockNumber} - ${toBlockNumber}: ${perc}%`);
        fromBlockNumber = toBlockNumber + 1;
        toBlockNumber = Math.min(toBlockNumber + increment, currentBlockHeight);
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    return `${name} events up to date`;
};

const subscribeToCryptoKittiesContractEvents = async (
    name: string,
    contracts: CryptoKittiesContracts,
    Models: CryptoKittiesModels,
    logEvent: (event: any) => Promise<void>,
    eventIncludes: string[],
    web3: any
) => {
    const events = await getContractEvents(contracts.Core.abi, contracts.Core.addr, web3);
    for (const eventName in events) {
        if (!eventIncludes.includes(eventName)) continue;
        events[eventName].on('data', async (event: any) => {
            if (event.event === 'Transfer' && event.returnValues?.from === '0x0000000000000000000000000000000000000000') {
                return;
            }
            const _event = await handleCryptoKittiesEvent(event, web3);
            const processedEvents: any[] = [_event];

            if (event.event === 'Transfer' && (
                _event.from === contracts.Sale.addr ||
                _event.to === contracts.Sale.addr ||
                _event.from === contracts.Sire.addr ||
                _event.to === contracts.Sire.addr
            )) {
                const { blockNumber } = _event;
                const auctionEventIncludes = ['AuctionCreated', 'AuctionCancelled', 'AuctionSuccessful'];
                const sireAuctionPastEvents = await getPastEvents(
                    contracts.Sire.abi, contracts.Sire.addr, blockNumber as number, blockNumber as number, auctionEventIncludes, web3
                );
                const saleAuctionPastEvents = await getPastEvents(
                    contracts.Sale.abi, contracts.Sale.addr, blockNumber as number, blockNumber as number, auctionEventIncludes, web3
                );
                for (const auctionEvent of [...sireAuctionPastEvents, ...saleAuctionPastEvents]) {
                    processedEvents.push(await handleCryptoKittiesEvent(auctionEvent, web3));
                }
                sortEvents(processedEvents);
            }

            await bulkLogEvents(processedEvents, Models as any);
            const eventsToLog = processedEvents.filter(({ event: e }) => eventIncludes.includes(e));
            for (const e of eventsToLog) {
                await logEvent(e);
            }
            console.log(`Retrieved ${name} ${event.event} event and corresponding auction events`);
        });
    }
};

export const getCryptoKittiesContractHistory = async (
    name: string,
    module: {
        Contracts: CryptoKittiesContracts;
        Models: CryptoKittiesModels;
        deployed: number;
        increment: number;
        logEvent: (event: any) => Promise<void>;
    },
    eventIncludes: string[],
    web3: any
) => {
    const { Contracts: C, Models, deployed, increment, logEvent } = module;
    const { VITE_ENABLE_INDEXER } = process.env;

    console.log('Starting cryptokitties contract history scan:', {
        contract: C.Core.addr,
        deployed,
        increment,
        events: eventIncludes,
        indexer: VITE_ENABLE_INDEXER === 'true',
    });

    if (VITE_ENABLE_INDEXER === 'true') {
        const events = await getPastContractEvents(
            name, C.Core.abi, C.Core.addr, deployed, increment, Models, logEvent, eventIncludes, web3
        );
        console.log(events);
    } else {
        console.log('cryptokitties events not indexed — switching to contract subscription');
    }

    await subscribeToCryptoKittiesContractEvents(name, C, Models, logEvent, eventIncludes, web3);
    await updateFloor(name, Models, { $or: [{ sale: true }, { sire: true }] });
};