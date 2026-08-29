import { Request, Response } from 'express';
import { CryptoKittiesModels } from '../models';

export const AUDIT_ID = 'ck_events_gap';

export async function readCkAudit(Models: CryptoKittiesModels) {
    const col = Models.Event.db.db?.collection('ck_audit');
    if (!col) return null;
    return col.findOne({ _id: AUDIT_ID as any });
}

const auditRoute = (Models: CryptoKittiesModels) => async (_req: Request, res: Response) => {
    try {
        const row = await readCkAudit(Models);
        if (!row) {
            res.status(404).json({ error: 'ck_audit snapshot not generated yet' });
            return;
        }
        res.json(row);
    } catch (error) {
        console.error('[cryptokitties] audit', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export default auditRoute;
