/** Histogram of ck_nfts.gen for the news Gens strip. */

export type GensSnapshot = Record<string, number>;

export const gensFromNfts = async (nfts: {
    aggregate: (pipeline: object[], opts?: object) => { toArray: () => Promise<{ _id: unknown; n: number }[]> };
}): Promise<GensSnapshot> => {
    const rows = await nfts
        .aggregate([{ $group: { _id: '$gen', n: { $sum: 1 } } }], { allowDiskUse: true })
        .toArray();
    const byGen = new Map<number, number>();
    let highestGen = 0;
    for (const row of rows) {
        const gen = Number(row._id || 0);
        byGen.set(gen, Number(row.n || 0));
        if (gen > highestGen) highestGen = gen;
    }
    const gens: GensSnapshot = {};
    for (let gen = 0; gen <= 25; gen += 1) {
        gens[`gen${gen}`] = byGen.get(gen) || 0;
    }
    let gen26etc = 0;
    for (const [gen, n] of byGen) {
        if (gen >= 26) gen26etc += n;
    }
    gens.gen26etc = gen26etc;
    gens.gen100 = byGen.get(100) || 0;
    gens.gen1000 = byGen.get(1000) || 0;
    gens.gen10000 = byGen.get(10000) || 0;
    gens.highestGen = highestGen;
    return gens;
};

export const stampGensOnLatestDaily = async (
    dailies: {
        find: (filter?: object) => { sort: (s: object) => { limit: (n: number) => { next: () => Promise<{ timestamp?: number } | null> } } };
        updateOne: (filter: object, update: object) => Promise<unknown>;
    },
    nfts: Parameters<typeof gensFromNfts>[0],
) => {
    const gens = await gensFromNfts(nfts);
    const latest = await dailies.find({}).sort({ timestamp: -1 }).limit(1).next();
    if (!latest?.timestamp) {
        throw new Error('no kn_dailies row to stamp gens onto');
    }
    await dailies.updateOne({ timestamp: latest.timestamp }, { $set: { gens } });
    return { timestamp: latest.timestamp, gens };
};
