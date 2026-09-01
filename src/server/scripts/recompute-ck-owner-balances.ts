/**
 * Recount ck_owners.balance from current ck_nfts.owner.
 * Listed kitties count for the lister, not Sale/Sire. Does not wipe tables.
 *
 * Usage:
 *   yarn ck:owner-balances -- --live
 *   yarn ck:owner-balances            (ck_nfts_next / ck_owners_next)
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { recomputeOwnerBalances } from '../modules/cryptokitties/ownerBalances';

dotenv.config({ path: path.resolve(process.cwd(), 'src/server/.env') });

const waitForDb = () =>
    new Promise<void>((resolve, reject) => {
        const uri = process.env.MONGODB_URI || 'mongodb://geneva-mongo:27017/geneva';
        mongoose.connect(uri).catch(reject);
        mongoose.connection.once('open', () => resolve());
        mongoose.connection.once('error', reject);
    });

const main = async () => {
    const live = process.argv.includes('--live');
    const nftsName = live ? 'ck_nfts' : 'ck_nfts_next';
    await waitForDb();
    console.log(`Recounting ${nftsName.replace('ck_nfts', 'ck_owners')}.balance from ${nftsName}.owner (lister, not Sale/Sire)`);
    const result = await recomputeOwnerBalances(mongoose.connection.db!, nftsName);
    console.log(result);
    await mongoose.disconnect();
};

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
