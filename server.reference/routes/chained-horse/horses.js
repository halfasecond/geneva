import express from 'express';
import Birth from '../../models/chained-horse/births'

const router = express.Router();

router.get('/', (req, res) => 
    Birth.find({}).sort({ tokenId: -1 }).then(data => res.status(200).send(data))
    .catch(err => console.log(err))
)

export default router