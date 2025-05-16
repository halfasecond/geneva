import express, { Router } from 'express';
import { Model } from 'mongoose';

interface Models {
    Event: Model<any>;
    NFT: Model<any>;
    Owner: Model<any>;
    Account: Model<any>;
    Message: Model<any>;
    [key: string]: Model<any>;
}

const routes = (Models: Models): Router => {
    const router = express.Router();

    // Get all NFTs
    router.get('/', async (req, res) => {
        try {
            const nfts = await Models.NFT.find({ owner: { $ne: '0x0000000000000000000000000000000000000000' } });
            // Create a Set to hold unique owners (Set automatically ensures uniqueness)
            const uniqueOwners = new Set();
            
            // Loop through the NFTs and add each owner to the Set
            nfts.forEach(nft => {
                uniqueOwners.add(nft.owner);
            });

            // Return the response with total NFTs and unique owners count
            res.json({
                total: nfts.length,
                ownersCount: uniqueOwners.size,  // Count of unique owners
                uniqueOwners: Array.from(uniqueOwners)  // Convert the Set to an array
            })
        } catch (err) {
            const error = err as Error;
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};

export default routes;
