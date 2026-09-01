import axios from 'axios';

export interface Cattribute {
    description: string;
    type: string;
    gene: number | null;
}

const CATTRIBUTES_URL = 'https://api.cryptokitties.co/cattributes';

/** Primary gene slot order matching createGenesObject / ck_nfts g0,g4,...g44 */
export const CATTRIBUTE_TYPES = [
    'body',
    'pattern',
    'coloreyes',
    'eyes',
    'colorprimary',
    'colorsecondary',
    'colortertiary',
    'wild',
    'mouth',
    'environment',
    'secret',
    'purrstige',
] as const;

let cache: Cattribute[] = [];

export const getCattributes = () => cache;

export const refreshCattributes = async (): Promise<Cattribute[]> => {
    const { data } = await axios.get(CATTRIBUTES_URL, { timeout: 15000 });
    if (!Array.isArray(data) || data.length === 0) {
        throw new Error('cattributes catalog empty');
    }
    cache = data as Cattribute[];
    return cache;
};

export const ensureCattributes = async (): Promise<Cattribute[]> => {
    if (cache.length) return cache;
    return refreshCattributes();
};

void refreshCattributes().catch((error) => {
    console.error('[cattributes] initial fetch failed', error);
});
