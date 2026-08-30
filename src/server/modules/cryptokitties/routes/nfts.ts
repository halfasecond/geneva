import axios from 'axios';
import express, { Router } from 'express';
import { CryptoKittiesModels } from '../models';

interface Cattribute {
    description: string;
    type: string;
    gene: number;
}

const routes = (Models: CryptoKittiesModels, defaultLimit = 20): Router => {
    const router = express.Router();
    const maxLimit = 2000;
    let cattributes: Cattribute[] = [];
    let searchables: string[] = [];

    axios.get('https://api.cryptokitties.co/cattributes')
        .then(res => {
            cattributes = [...res.data];
            searchables = cattributes.map(({ description }) => description);
        })
        .catch(e => console.log(e));

    router.get('/', async (req, res) => {
        const query: Record<string, unknown> = {};

        const searchParams = req.query.search;
        if (searchParams && typeof searchParams === 'string') {
            searchQueryItems(searchParams, query, cattributes, searchables);
        }

        const ownerRaw = req.query.owner_wallet_address || req.query.wallet;
        let owner = '';
        if (ownerRaw && typeof ownerRaw === 'string') {
            owner = ownerRaw.replace(/[[\]]/g, '').trim().toLowerCase();
            if (owner.startsWith('0x')) query.owner = { $eq: owner };
        }

        const includeParams = typeof req.query.include === 'string' ? req.query.include : '';
        const includeQueryItems = includeParams.split(',').filter(Boolean);
        if (includeQueryItems.length) {
            const or: Record<string, unknown>[] = [];
            if (includeQueryItems.includes('sale')) or.push({ sale: true });
            if (includeQueryItems.includes('sire')) or.push({ sire: true });
            if (includeQueryItems.includes('other')) or.push({ sale: false, sire: false });
            if (or.length > 0) query.$or = or;
        }

        const sort: Record<string, 1 | -1> = {};
        const orderBy = req.query.orderBy;
        const orderDirection = req.query.orderDirection === 'desc' ? -1 : 1;
        if (orderBy === 'current_price') {
            sort.currentPrice = orderDirection;
            // Market browse only: missing currentPrice sorts first and looks
            // like a broken floor. Wallet / "other" views must keep unpriced kitties.
            const marketOnly =
                !owner &&
                (includeQueryItems.includes('sale') || includeQueryItems.includes('sire')) &&
                !includeQueryItems.includes('other');
            if (marketOnly) {
                query.currentPrice = { $exists: true, $nin: [null, ''] };
            }
        } else {
            sort.tokenId = orderDirection;
        }

        const parsedLimit = parseInt(String(req.query.limit), 10);
        const limit = Number.isFinite(parsedLimit) && parsedLimit > 0
            ? Math.min(parsedLimit, maxLimit)
            : defaultLimit;
        const page = parseInt(String(req.query.page), 10) || 1;
        const skip = (page - 1) * limit;

        try {
            const [kitties, total] = await Promise.all([
                Models.NFT.find(query).sort(sort).skip(skip).limit(limit).exec(),
                Models.NFT.countDocuments(query),
            ]);
            res.status(200).send({ kitties, total });
        } catch (error) {
            console.error('Error fetching NFTs:', error);
            res.status(500).send({ error: 'Internal Server Error' });
        }
    });

    return router;
};

function searchQueryItems(
    searchParams: string,
    query: Record<string, unknown>,
    cattributes: Cattribute[],
    searchables: string[]
) {
    const searchQueryItems = searchParams.split('+');
    searchQueryItems[0].split(' ').forEach((item) => {
        const [key, value] = item.split(':');
        if (key && value !== undefined) {
            switch (key) {
                case 'id': {
                    if (value.includes(',')) {
                        query.tokenId = { $in: value.split(',').map(Number) };
                    } else {
                        const idRange = value.split('-');
                        query.tokenId = idRange.length === 2
                            ? { $gte: Number(idRange[0]), $lte: Number(idRange[1]) }
                            : { $eq: Number(value) };
                    }
                    break;
                }
                case 'gen': {
                    const genRange = value.split('-');
                    query.gen = genRange.length === 2
                        ? { $gte: Number(genRange[0]), $lte: Number(genRange[1]) }
                        : { $in: value.split(',') };
                    break;
                }
                case 'hatchedBy':
                    query.hatchedBy = value.toLowerCase();
                    break;
                case 'account':
                case 'wallet': {
                    const addr = value.replace(/[[\]]/g, '').toLowerCase();
                    if (addr.startsWith('0x')) query.owner = { $eq: addr };
                    break;
                }
                case 'm1':
                    query.sl0m1 = value === 'any' ? { $gt: 0 } : { $eq: Number(value) };
                    break;
                case 'm2':
                    query.sl0m2 = value === 'any' ? { $gt: 0 } : { $eq: Number(value) };
                    break;
                case 'm3':
                    query.sl0m3 = value === 'any' ? { $gt: 0 } : { $eq: Number(value) };
                    break;
                case 'm4':
                    query.sl0m4 = value === 'any' ? { $gt: 0 } : { $eq: Number(value) };
                    break;
                case 'virgin':
                    if (value === 'true') query.offspring = 0;
                    break;
                case 'hats':
                    if (value === 'true') query.hats = { $exists: true, $ne: [] };
                    break;
            }
        } else if (searchables.includes(item) || searchables.includes(item.replace('pb-', ''))) {
            const cattributeTypes = [
                'body', 'pattern', 'coloreyes', 'eyes', 'colorprimary',
                'colorsecondary', 'colortertiary', 'wild', 'mouth', 'environment', 'secret', 'purrstige',
            ];
            const g = cattributes.find(({ description }) =>
                description === item || description === item.replace('pb-', '')
            );
            if (g) {
                const cattributeTypeRowNumber = cattributeTypes.indexOf(g.type) * 4;
                query[`g${cattributeTypeRowNumber}`] = g.gene;
                if (item.includes('pb-')) {
                    query[`g${cattributeTypeRowNumber}pb`] = true;
                }
            }
        }
    });
}

export default routes;