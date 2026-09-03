import axios from 'axios';

const CK_API = 'https://api.cryptokitties.co/v3/kitties';

type KittyRow = {
    tokenId?: number;
    id?: number;
    enhanced_cattributes?: unknown;
    toObject?: () => KittyRow;
    [key: string]: unknown;
};

export async function attachEnhancedCattributes<T>(kitties: T[]): Promise<T[]> {
    const rows = kitties.map((kitty) => {
        const row = kitty as KittyRow;
        return (typeof row.toObject === 'function' ? row.toObject() : row) as T & KittyRow;
    });
    const ids = [...new Set(
        rows
            .map((kitty) => Number(kitty.tokenId ?? kitty.id))
            .filter((id) => Number.isFinite(id)),
    )];
    if (!ids.length) return rows as T[];
    try {
        const { data } = await axios.get(`${CK_API}?search=id:${ids.join(',')}&limit=${ids.length}`, {
            timeout: 8000,
        });
        const byId = new Map<number, unknown[]>();
        for (const ck of data?.kitties || []) {
            if (ck?.id != null && Array.isArray(ck.enhanced_cattributes)) {
                byId.set(Number(ck.id), ck.enhanced_cattributes);
            }
        }
        return rows.map((kitty) => {
            const existing = kitty.enhanced_cattributes;
            if (Array.isArray(existing) && existing.length) return kitty;
            const traits = byId.get(Number(kitty.tokenId ?? kitty.id));
            return traits ? { ...kitty, enhanced_cattributes: traits } : kitty;
        }) as T[];
    } catch (error) {
        console.error('[ck] enhanced_cattributes', error);
        return rows as T[];
    }
}
