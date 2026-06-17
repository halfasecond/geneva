import { genes } from './geneData';

type GeneCounts = { m0: number; m1: number; m2: number; m3: number; m4: number };

export const createGenesObject = (_genes: string): Record<string, unknown> | string => {
    const geneToBinary = BigInt(_genes).toString(2).padStart(240, '0');
    const geneBlocks = [...geneToBinary.match(/.{1,5}/g)!.reverse()];
    if (geneBlocks.length !== 48) {
        return 'kitty 0! ignoring...';
    }

    const g: Record<string, unknown> = {};
    const counts: GeneCounts[] = [
        { m0: 0, m1: 0, m2: 0, m3: 0, m4: 0 },
        { m0: 0, m1: 0, m2: 0, m3: 0, m4: 0 },
        { m0: 0, m1: 0, m2: 0, m3: 0, m4: 0 },
        { m0: 0, m1: 0, m2: 0, m3: 0, m4: 0 },
    ];

    geneBlocks.forEach((_gene, i) => {
        const slot = i % 4;
        const gene = genes.findIndex(({ binary }) => binary === _gene);
        if (gene === 30) counts[slot].m4++;
        else if (gene >= 28) counts[slot].m3++;
        else if (gene >= 24) counts[slot].m2++;
        else if (gene >= 16) counts[slot].m1++;
        else if (gene >= 0) counts[slot].m0++;
        g[`g${i}`] = gene;
        if (slot === 3) {
            g[`g${i - 3}pb`] = (
                geneBlocks[i - 3] === geneBlocks[i - 2] &&
                geneBlocks[i - 2] === geneBlocks[i - 1] &&
                geneBlocks[i - 1] === geneBlocks[i]
            );
        }
    });

    for (let i = 0; i < 4; i++) {
        for (let q = 0; q < 5; q++) {
            g[`sl${i}m${q}`] = counts[i][`m${q}` as keyof GeneCounts];
        }
    }
    return g;
};