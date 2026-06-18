import { Model } from 'mongoose';
import { fetchVechTokenMetadata } from './metadata';

interface Models {
    NFT: Model<any>;
}

interface ReindexResult {
    total: number;
    updated: number;
    failed: number;
    skipped: number;
}

export const reindexVechMetadata = async (
    Models: Models,
    web3: any,
    { all = false }: { all?: boolean } = {},
): Promise<ReindexResult> => {
    const query = all
        ? {}
        : { $or: [{ animation_url: { $exists: false } }, { animation_url: null }, { animation_url: '' }] };

    const nfts = await Models.NFT.find(query).sort({ tokenId: 1 });
    const result: ReindexResult = { total: nfts.length, updated: 0, failed: 0, skipped: 0 };

    console.log(`vech metadata pass: ${result.total} NFTs (${all ? 'all' : 'missing animation_url only'})`);

    for (const nft of nfts) {
        const patch = await fetchVechTokenMetadata(web3, nft.tokenId);
        if (!patch?.animation_url) {
            if (patch) result.skipped += 1;
            else result.failed += 1;
            continue;
        }

        try {
            await Models.NFT.findOneAndUpdate({ tokenId: nft.tokenId }, patch).exec();
            result.updated += 1;

            if (result.updated % 25 === 0) {
                console.log(`vech metadata pass: ${result.updated}/${result.total}`);
            }
        } catch (error) {
            result.failed += 1;
            console.error(`vech metadata pass save failed for #${nft.tokenId}:`, error);
        }

        await sleep(50);
    }

    console.log('vech metadata pass complete:', result);
    return result;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));