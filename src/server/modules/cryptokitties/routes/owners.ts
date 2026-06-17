import express, { Router } from 'express';
import { CryptoKittiesModels } from '../models';

const routes = (Models: CryptoKittiesModels): Router => {
    const router = express.Router();

    router.get('/', (_req, res) => {
        Models.Owner.find({ balance: { $gt: 0 } }, '-_id -__v')
            .then(data => { res.status(200).send(data); })
            .catch(err => console.log(err));
    });

    return router;
};

export default routes;