import axios from 'axios';
import express, { Router } from 'express';

const routes = (): Router => {
    const router = express.Router();
    let cattributes: unknown[] = [];

    axios.get('https://api.cryptokitties.co/cattributes')
        .then(res => { cattributes = [...res.data]; })
        .catch(e => console.log(e));

    router.get('/', (_req, res) => { res.status(200).send(cattributes); });

    return router;
};

export default routes;