import express, { Router } from 'express';
import { Model } from 'mongoose';
import diamonds, { proofs } from '../diamonds'
import exclusives, { proofs as exclusiveProofs } from '../exclusives';

interface Models {
    Account: Model<any>;
    Event: Model<any>;
    Balance: Model<any>;
    Claim: Model<any>;
    [key: string]: Model<any>;
}

const routes = (Models: Models): Router => {
    const router = express.Router();
    router.get('/:tokenId', async (req, res) => {
        try {
            const tokenId = parseInt(req.params.tokenId);
            // Check if already claimed
            const claim = await Models.Claim.findOne({ tokenId });
            if (claim) {
                return res.json({ 
                    tokenId,
                    eligible: true, 
                    claimed: true,
                    address: claim.address
                });
            }

            // Check if diamond kitty
            if (diamonds.includes(tokenId)) {
                const proof = proofs[tokenId.toString()];
                return res.json({
                    tokenId,
                    eligible: true,
                    claimed: false,
                    isDiamond: true,
                    isExclusive: false,
                    proof
                });
            }

            // Check if exclusive kitty
            if (exclusives.includes(tokenId)) {
                console.log('in here')
                const proof = exclusiveProofs[tokenId.toString()];
                return res.json({
                    tokenId,
                    eligible: true,
                    claimed: false,
                    isDiamond: false,
                    isExclusive: true,
                    proof
                });
            }
            
            // Check if day1 (ID <= 3365)
            if (tokenId <= 3365) {
                return res.json({ 
                    tokenId,
                    eligible: true, 
                    claimed: false,
                    isDiamond: false,
                    isExclusive: false,
                });
            }
            
            // Not eligible
            return res.json({ tokenId, eligible: false });
        } catch (err) {
            const error = err as Error;
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};

export default routes;
