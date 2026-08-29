import { Express } from 'express';
import { Connection } from 'mongoose';
import { KittyFamilyModels } from './models';
import { familyService } from './service';
import auth from './auth';

export default (app: Express, Models: KittyFamilyModels, db: Connection) => {
    const family = familyService(Models, db);
    const authRouter = auth(Models, db);
    app.use('/kittyfamily-auth', authRouter);
    app.use('/kittyfamily-', authRouter);

    app.get('/kittyfamily-accounts', async (req, res) => {
        try {
            const raw = typeof req.query.accounts === 'string' ? req.query.accounts : '';
            const list = raw
                .replace('[', '')
                .replace(']', '')
                .split(',')
                .map((value) => value.trim())
                .filter(Boolean);
            res.json(await family.accountsByAddress(list));
        } catch (error) {
            console.error('[kittyfamily] accounts', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
};
