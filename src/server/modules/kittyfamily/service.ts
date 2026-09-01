import { Connection } from 'mongoose';
import { KittyFamilyModels } from './models';
import { ckModels } from '../kittynews/queries';

const ACCOUNT_PUBLIC = '-token -__v';

export function familyService(Models: KittyFamilyModels, db: Connection) {
    const messages = async () => {
        const [rows, accounts] = await Promise.all([
            Models.Message.find({}).sort({ createdAt: 1 }).select('-__v').lean(),
            Models.Account.find({}).select('address avatar').lean(),
        ]);
        const avatars = new Map(
            accounts.map((account: any) => [String(account.address ?? '').toLowerCase(), account]),
        );
        return rows.map((row: any) => {
            const account = String(row.account ?? '').toLowerCase();
            const match = avatars.get(account) as { avatar?: number } | undefined;
            return { ...row, avatar: match?.avatar };
        });
    };

    const addMessage = async (account: string, message: string) => {
        const text = message.trim().slice(0, 140);
        const addr = account.toLowerCase();
        if (!text || !addr.startsWith('0x')) return messages();
        await Models.Message.create({ account: addr, message: text });
        return messages();
    };

    const accounts = () => Models.Account.find({}).select(ACCOUNT_PUBLIC).lean();

    const accountsByAddress = async (addresses: string[]) => {
        const Owner = ckModels(db)?.Owner;
        const result = [];
        for (const raw of addresses) {
            const address = raw.trim().toLowerCase();
            if (!address) continue;
            const NFT = ckModels(db)?.NFT;
            const [existingRows, owner, held] = await Promise.all([
                Models.Account.find({ address: { $regex: `^${address}$`, $options: 'i' } })
                    .select(ACCOUNT_PUBLIC)
                    .lean() as Promise<Array<{ avatar?: number; displayName?: string; followers?: string[]; following?: string[] }>>,
                Owner ? Owner.findOne({ owner: address }).lean() : Promise.resolve(null),
                NFT ? NFT.countDocuments({ owner: address }) : Promise.resolve(null),
            ]);
            const existing =
                existingRows.find((row) => (row.avatar ?? -1) > -1 || row.displayName) ?? existingRows[0] ?? null;
            const ownerDoc = owner as { balance?: number; birthed?: number; balanceAll?: number } | null;
            result.push({
                avatar: existing?.avatar ?? -1,
                displayName: existing?.displayName,
                followers: existing?.followers ?? [],
                following: existing?.following ?? [],
                balance: held ?? ownerDoc?.balance ?? null,
                birthed: ownerDoc?.birthed ?? null,
                balanceAll: ownerDoc?.balanceAll ?? null,
                address,
            });
        }
        return result;
    };

    return { messages, addMessage, accounts, accountsByAddress };
}
