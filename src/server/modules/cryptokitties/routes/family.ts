import express, { Router } from 'express';
import { CryptoKittiesModels } from '../models';

const routes = (Models: CryptoKittiesModels): Router => {
    const router = express.Router();

    router.get('/', async (req, res) => {
        const query: Record<string, unknown> = {};
        const searchParams = req.query.search;
        if (searchParams && typeof searchParams === 'string') {
            const searchQueryItems = searchParams.split('+');
            searchQueryItems[0].split(' ').forEach((item) => {
                const [key, value] = item.split(':');
                if (key && value !== undefined && key === 'id') {
                    const idRange = value.split('-');
                    if (idRange.length === 2) {
                        query.tokenId = { $gte: Number(idRange[0]), $lte: Number(idRange[1]) };
                    } else {
                        query.tokenId = { $in: value.split(',') };
                    }
                }
            });
        }

        try {
            const kitty = await Models.NFT.findOne(query).select(['-_id', '-__v']).exec();
            if (!kitty) {
                res.status(500).send({ error: 'Internal Server Error' });
                return;
            }

            const kitties: Record<string, unknown>[] = [kitty.toObject()];
            if ((kitty.gen as number) > 0) {
                const parents = await Models.NFT.find({ tokenId: { $in: [kitty.matronId, kitty.sireId] } })
                    .select(['-_id', '-__v']).limit(2).exec();
                const grandparentIds: number[] = [];
                parents.forEach((parent) => {
                    kitties.push(parent.toObject());
                    if ((parent.gen as number) > 0) {
                        grandparentIds.push(parent.matronId as number, parent.sireId as number);
                    }
                });
                if (grandparentIds.length > 1) {
                    const grandparents = await Models.NFT.find({ tokenId: { $in: grandparentIds } })
                        .select(['-_id', '-__v']).limit(4).exec();
                    const greatgrandParentIds: number[] = [];
                    grandparents.forEach((grandparent) => {
                        kitties.push(grandparent.toObject());
                        if ((grandparent.gen as number) > 0) {
                            greatgrandParentIds.push(grandparent.matronId as number, grandparent.sireId as number);
                        }
                    });
                    if (greatgrandParentIds.length > 1) {
                        const greatgrandparents = await Models.NFT.find({ tokenId: { $in: greatgrandParentIds } })
                            .select(['-_id', '-__v']).limit(8).exec();
                        greatgrandparents.forEach((g) => kitties.push(g.toObject()));
                    }
                }
            }
            res.status(200).send({ kitties, total: kitties.length });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).send({ error: 'Internal Server Error' });
        }
    });

    return router;
};

export default routes;