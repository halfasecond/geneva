import { Express } from 'express';
import { Connection, Schema } from 'mongoose';

const existing = (db: Connection, name: string) =>
    db.models[name] || db.model(name, new Schema({}, { strict: false, strictQuery: false }), name);

const list = async (Model: ReturnType<typeof existing>, type?: string) => {
    const filter = type ? { contentType: type } : {};
    return Model.find(filter).sort({ publishedDate: -1 }).select('-__v').lean();
};

const bySlug = async (Model: ReturnType<typeof existing>, slug: string) =>
    Model.findOne({ slug }).select('-__v').lean();

const runModule = ({ app, db }: { app: Express; db: Connection }) => {
    const Cms = existing(db, 'has_cms');
    const Articles = existing(db, 'has_articles');

    const mount = (base: string, Model: ReturnType<typeof existing>) => {
        app.get(base, async (req, res) => {
            try {
                const type = typeof req.query.type === 'string' ? req.query.type : undefined;
                res.json(await list(Model, type));
            } catch (error) {
                console.error(`[has] ${base}`, error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });

        app.get(`${base}/:slug`, async (req, res) => {
            try {
                const copy = await bySlug(Model, req.params.slug);
                if (!copy) {
                    res.status(404).json({ error: 'Copy not found' });
                    return;
                }
                res.json(copy);
            } catch (error) {
                console.error(`[has] ${base} slug`, error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });
    };

    // has-api used /has-cms; also expose /has/cms and articles.
    mount('/has-cms', Cms);
    mount('/has/cms', Cms);
    mount('/has-articles', Articles);
    mount('/has/articles', Articles);
};

export default runModule;
