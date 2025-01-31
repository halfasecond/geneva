import Web3 from "web3";
import express from 'express';
import Birth from '../../models/chained-horse/births'

const router = express.Router();
const web3 = new Web3(Web3.givenProvider);

router.get('/', async (req,res) => {
    if (req.query.id) {
        try {
            const birth = await Birth.findOne({ tokenId: req.query.id }).exec();
            const data = Object.assign({}, birth.toObject(), {});
            res.status(200).send(data);
        } catch (err) {
            console.error(err);
            res.status(500).send({ message: 'Server error' });
        }
    }
})

export default router