import BN from 'bn.js';
import Contracts from './contracts';
import { createGenesObject } from './genes';
import { calculateCurrentPrice } from './indexer';
import { padValue, valuesForTx } from './marketplaceValue';
import { CryptoKittiesModels } from './models';

const cooldowns = [60, 120, 300, 600, 1800, 3600, 7200, 14400, 28800, 57600, 86400, 172800, 345600, 604800];
const blocksPerSecond = 15;

export type CryptoKittiesWeb3 = {
    eth: {
        getTransaction: (hash: string) => Promise<{ value: bigint }>;
        getTransactionReceipt?: (hash: string) => Promise<{ logs?: Array<{ address: string; topics: string[]; data: string }> } | null>;
    };
};

export type CryptoKittiesEmitter = { emit: (name: string) => void };

export const noopEmitter: CryptoKittiesEmitter = { emit: () => {} };

export const mockWeb3: CryptoKittiesWeb3 = {
    eth: {
        getTransaction: async () => ({ value: 0n }),
    },
};

const handleSaleOrSireEvent = async (
    event: Record<string, unknown>,
    web3: CryptoKittiesWeb3,
    Models: CryptoKittiesModels,
    sale: boolean,
    from: string,
    to: string,
    tokenId: number,
    emitter: CryptoKittiesEmitter,
) => {
    try {
        const doc = await Models.Event.findOne({
            event: { $ne: 'Transfer' },
            blockNumber: Number(event.blockNumber),
            transactionHash: event.transactionHash,
        }).exec();
        if (!doc) {
            await handleTransferOrAuctionEnd(event, Models, web3, from, to, tokenId, emitter);
            return;
        }
        const { timestamp, startingPrice, endingPrice, duration } = doc;
        if (startingPrice) {
            const auctionStart = timestamp!.toString();
            const auctionEnd = new BN(timestamp as number).add(new BN((duration as number).toString())).toString();
            const currentPrice = calculateCurrentPrice(
                startingPrice as string,
                endingPrice as string,
                auctionStart,
                auctionEnd,
                auctionStart,
            );
            await Models.NFT.findOneAndUpdate(
                { tokenId },
                {
                    sale,
                    sire: !sale,
                    currentPrice,
                    startingPrice,
                    endingPrice,
                    duration,
                    auctionStart: Number(auctionStart),
                    auctionEnd: Number(auctionEnd),
                },
                { upsert: false },
            ).exec();
        } else {
            await handleTransferOrAuctionEnd(event, Models, web3, from, to, tokenId, emitter);
        }
    } catch (error) {
        console.error('Error handling sale/sire event:', event.tokenId, error);
    }
};

const handleTransferOrAuctionEnd = async (
    event: Record<string, unknown>,
    Models: CryptoKittiesModels,
    web3: CryptoKittiesWeb3,
    from: string,
    to: string,
    tokenId: number,
    emitter: CryptoKittiesEmitter,
) => {
    const isSaleEnd = from === Contracts.Sale.addr;
    const isSireEnd = from === Contracts.Sire.addr;
    if (isSaleEnd || isSireEnd) {
        await handleAuctionEnd(event, Models, isSaleEnd, emitter);
    } else {
        if (web3.eth.getTransactionReceipt) {
            const priced = await valuesForTx(web3, event.transactionHash as string);
            const wei = priced.get(tokenId);
            if (wei !== undefined && wei > 0n) {
                await Models.Event.updateOne(
                    { tokenId: event.tokenId, blockNumber: event.blockNumber, logIndex: event.logIndex },
                    { $set: { value: padValue(wei) } },
                );
                emitter.emit('ckSale');
            } else {
                await Models.Event.updateOne(
                    { tokenId: event.tokenId, blockNumber: event.blockNumber, logIndex: event.logIndex },
                    { $unset: { value: '' } },
                );
            }
        }
        await Models.NFT.findOneAndUpdate(
            { tokenId },
            { owner: to, $addToSet: { owners: to } },
            { upsert: false },
        ).exec();
        await updateOwnerBalances(from, to, Models);
    }
};

const handleAuctionEnd = async (
    event: Record<string, unknown>,
    Models: CryptoKittiesModels,
    isSaleEnd: boolean,
    emitter: CryptoKittiesEmitter,
) => {
    try {
        const auctionEndEvent = await Models.Event.findOne({
            event: { $ne: 'Transfer' },
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
        }).exec();
        const currentDoc = await Models.NFT.findOne({ tokenId: event.tokenId }).exec();
        if (!auctionEndEvent || !currentDoc) return;

        const unset: Record<string, unknown> = {
            sale: false,
            sire: false,
            $unset: {
                currentPrice: '',
                startingPrice: '',
                endingPrice: '',
                duration: '',
                auctionStart: '',
                auctionEnd: '',
            },
        };
        if (auctionEndEvent.winner && isSaleEnd) {
            const from = (currentDoc.owner as string).toLowerCase();
            const to = (auctionEndEvent.winner as string).toLowerCase();
            unset.owner = to;
            unset.$addToSet = { owners: to };
            await updateOwnerBalances(from, to, Models);
            await Models.Event.updateOne(
                { tokenId: event.tokenId, blockNumber: event.blockNumber, logIndex: event.logIndex },
                { $set: { value: (auctionEndEvent.totalPrice as string).toString().padStart(35, '0') } },
            );
            emitter.emit('ckSale');
        }
        await Models.NFT.findOneAndUpdate({ tokenId: event.tokenId }, unset, { upsert: false });
    } catch (error) {
        console.error('Error handling auction end:', error);
    }
};

const handleBirthEvent = async (event: Record<string, unknown>, Models: CryptoKittiesModels) => {
    const birth = { ...event };
    birth.owners = [event.owner];
    birth.hatchedBy = event.owner;

    if (event.matronId === 0 && event.sireId === 0) {
        birth.gen = 0;
    } else {
        const matron = await Models.NFT.findOneAndUpdate(
            { tokenId: event.matronId },
            { pregnant: false, $inc: { offspring: 1 }, $push: { offspringIds: event.tokenId } },
            { upsert: false },
        );
        const sire = await Models.NFT.findOneAndUpdate(
            { tokenId: event.sireId },
            { $inc: { offspring: 1 }, $push: { offspringIds: event.tokenId } },
            { upsert: false },
        );
        if (!matron || !sire) return;
        birth.gen =
            (matron.gen as number) >= (sire.gen as number)
                ? (matron.gen as number) + 1
                : (sire.gen as number) + 1;
    }

    birth.cooldownIndex = Math.min(Math.floor((birth.gen as number) / 2), 13);
    const genes = createGenesObject(birth.genes as string);
    const kitty = typeof genes === 'string' ? birth : { ...birth, ...genes };
    try {
        await new Models.NFT(kitty).save();
        await Models.Owner.findOneAndUpdate(
            { owner: event.owner },
            { $inc: { balance: 1, birthed: 1 } },
            { upsert: true },
        ).exec();
    } catch (error) {
        console.error('Error handling birth event:', error);
    }
};

const updateOwnerBalances = async (from: string, to: string, Models: CryptoKittiesModels) => {
    await Models.Owner.findOneAndUpdate({ owner: from }, { $inc: { balance: -1 } }, { upsert: false }).exec();
    await Models.Owner.findOneAndUpdate({ owner: to }, { $inc: { balance: 1 } }, { upsert: true }).exec();
};

export const processCryptoKittiesEvent = async (
    event: Record<string, unknown>,
    Models: CryptoKittiesModels,
    web3: CryptoKittiesWeb3,
    emitter: CryptoKittiesEmitter = noopEmitter,
) => {
    if (event.event === 'Transfer') {
        const tokenId = event.returnValues
            ? Number((event.returnValues as Record<string, unknown>).tokenId)
            : Number(event.tokenId);
        const to = event.returnValues
            ? ((event.returnValues as Record<string, unknown>).to as string).toLowerCase()
            : (event.to as string).toLowerCase();
        const from = event.returnValues
            ? ((event.returnValues as Record<string, unknown>).from as string).toLowerCase()
            : (event.from as string).toLowerCase();
        const sale = to === Contracts.Sale.addr;
        const sire = to === Contracts.Sire.addr;
        if (sale || sire) {
            await handleSaleOrSireEvent(event, web3, Models, sale, from, to, tokenId, emitter);
        } else {
            await handleTransferOrAuctionEnd(event, Models, web3, from, to, tokenId, emitter);
        }
        emitter.emit('ckTransfer');
    }

    if (event.event === 'Birth') {
        await handleBirthEvent(event, Models);
        emitter.emit('ckBirth');
    }

    if (event.event === 'Pregnant') {
        const { sireId, matronId, cooldownEndBlock, blockNumber } = event;
        const nfts = await Models.NFT.find({ tokenId: { $in: [sireId, matronId] } });
        const sire = nfts.find((nft) => nft.tokenId === sireId);
        const matron = nfts.find((nft) => nft.tokenId === matronId);
        if (!sire || !matron) return;

        const sirePartnerIds = (sire.partnerIds as number[] | undefined) ?? [];
        if (!sirePartnerIds.includes(matron.tokenId as number)) {
            sire.partners = sire.partners ? (sire.partners as number) + 1 : 1;
            sire.partnerIds = sire.partnerIds
                ? [...(sire.partnerIds as number[]), matron.tokenId as number]
                : [matron.tokenId as number];
            matron.partners = matron.partners ? (matron.partners as number) + 1 : 1;
            matron.partnerIds = matron.partnerIds
                ? [...(matron.partnerIds as number[]), sire.tokenId as number]
                : [sire.tokenId as number];
        }
        sire.cooldownEndBlock =
            cooldowns[sire.cooldownIndex as number] / blocksPerSecond + (blockNumber as number);
        sire.cooldownIndex = sire.cooldownIndex === 13 ? 13 : (sire.cooldownIndex as number) + 1;
        matron.cooldownEndBlock = cooldownEndBlock;
        matron.cooldownIndex = matron.cooldownIndex === 13 ? 13 : (matron.cooldownIndex as number) + 1;
        matron.pregnant = true;
        await sire.save();
        await matron.save();
        emitter.emit('ckPregnant');
    }
};