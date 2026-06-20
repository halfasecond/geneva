import { Model } from 'mongoose';

const STARTING_CREDITS = 12000;

interface WalletCreditModels {
    Account: Model<any>;
    Save: Model<any>;
}

export async function resolveWalletCredits(
    Models: WalletCreditModels,
    address: string,
    hintCredits?: number,
): Promise<number> {
    const account = await Models.Account.findOne({ address });
    if (account?.credits != null && Number.isFinite(account.credits)) {
        return account.credits;
    }

    let credits = hintCredits;
    if (credits == null || !Number.isFinite(credits)) {
        const saves = await Models.Save.find({ walletAddress: address }).lean();
        credits = saves.reduce((max: number, doc) => {
            const hullCredits = (doc.player as { credits?: number } | undefined)?.credits;
            return Number.isFinite(hullCredits) ? Math.max(max, hullCredits!) : max;
        }, 0);
    }
    if (!credits) credits = STARTING_CREDITS;

    await Models.Account.findOneAndUpdate(
        { address },
        { $set: { credits } },
        { upsert: true },
    );
    return credits;
}

export async function setWalletCredits(
    Models: WalletCreditModels,
    address: string,
    credits: number,
): Promise<void> {
    if (!Number.isFinite(credits)) return;
    await Models.Account.findOneAndUpdate(
        { address },
        { $set: { credits } },
        { upsert: true },
    );
}

export function stripCreditsFromPlayer(player: Record<string, unknown>): {
    hullPlayer: Record<string, unknown>;
    credits: number | undefined;
} {
    const { credits, ...hullPlayer } = player;
    return {
        hullPlayer,
        credits: typeof credits === 'number' && Number.isFinite(credits) ? credits : undefined,
    };
}