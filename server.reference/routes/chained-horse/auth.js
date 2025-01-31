import Web3 from 'web3'
import express from 'express'
import jwt from 'jsonwebtoken'
import Account from '../../models/chained-horse/accounts'

const JWT_SECRET = process.env.JWT_SECRET;
const router = express.Router();
const web3 = new Web3(Web3.givenProvider)
router.post('/', async (req, res) => {
    const { address, signature, message } = req.body;
    try {
        // Recover the signer's address from the signature
        const recoveredSigner = web3.eth.accounts.recover(
            message,
            signature,
            ''
        )
        // Check if the recovered address matches the expected signer's address
        if (recoveredSigner.toLowerCase() === address.toLowerCase()) {
            const token = jwt.sign({ userId: recoveredSigner }, JWT_SECRET);
            const account = await Account.findOneAndUpdate(
            { address: address.toLowerCase() },
            { $set: { token } },
            { upsert: true, new: true }
            );
            res.status(200).json({ token });
        } else {
            // Authentication failed
            res.status(401).json({ authenticated: false });
        }
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ authenticated: false });
    }
});
    
router.post('/check-token', (req, res) => {
    const { token } = req.body;
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const { userId } = decoded;
        Account.findOne({ address: userId.toLowerCase(), token }).then((account) => {
            if (account) {
                const { avatar, level, left, top, transform, hay, newbIslandRace } = account
                res.status(200).json({ valid: true, address: userId, avatar, level, left, top, transform, hay, newbIslandRace })
            } else {
                res.status(200).json({ valid: false });
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});
    
router.post('/logout', async (req, res) => {
    const { token } = req.body;
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const { userId } = decoded;
        const account = await Account.findOne({ address: userId.toLowerCase(), token });
        if (account) {
            await Account.updateOne({ address: userId.toLowerCase() }, { $unset: { token: 1 } });
            res.status(200).json({ message: 'Logged out successfully.' });
        } else {
            res.status(401).json({ message: 'Invalid token.' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
})

export default router;