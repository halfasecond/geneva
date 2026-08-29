import { Express } from 'express';
import { KittyInternationalModels } from './models';
import auth from './auth';

export default (app: Express, Models: KittyInternationalModels) => {
    const authRouter = auth(Models);
    app.use('/kittyinternational/auth', authRouter);
    // Live CRA had a typo on logout; keep both paths so old cookies still clear.
    app.use('/ittyinternational/auth', authRouter);
};
