/**
 * Stamp sale/sire on a kitty table from who currently owns it.
 * Default target is ck_nfts_next (live stays up). Pass --live to stamp ck_nfts.
 *
 * Usage:
 *   yarn ck:stamp-auctions
 *   yarn ck:stamp-auctions -- --live
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { stampAuctionsFromOwners } from '../modules/cryptokitties/stampAuctions';
import { AUDIT_ID } from '../modules/cryptokitties/routes/audit';

dotenv.config({ path: path.resolve(process.cwd(), 'src/server/.env') });

const waitForDb = () =>
    new Promise<void>((resolve, reject) => {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/geneva';
        mongoose.connect(uri).catch(reject);
        mongoose.connection.once('open', () => resolve());
        mongoose.connection.once('error', reject);
    });

const main = async () => {
    const live = process.argv.includes('--live');
    const skipAssign = process.argv.includes('--prices-only');
    const skipPrices = process.argv.includes('--owners-only');
    const nftsName = live ? 'ck_nfts' : 'ck_nfts_next';
    await waitForDb();
    console.log(
        skipPrices
            ? `Restoring listers on ${nftsName} (keep prices/flags)...`
            : skipAssign
              ? `Pricing open auctions on ${nftsName} (owners already assigned)...`
              : `Stamping sale/sire on ${nftsName}; display owner is the lister...`,
    );
    const result = await stampAuctionsFromOwners(mongoose.connection.db!, nftsName, { skipAssign, skipPrices });
    console.log(result);
    await mongoose.connection.db!.collection('ck_audit').updateOne(
        { _id: AUDIT_ID as any },
        {
            $set: {
                note: `Auction stamp on ${nftsName}: listed ${result.listed}, moved ${result.moved}, sale ${result.onSale}, sire ${result.onSire}, priced ${result.priced}, skipped ${result.skipped}, cleared ${result.cleared}.`,
                updatedAt: new Date(),
            },
        },
        { upsert: true },
    );
    await mongoose.disconnect();
};

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
