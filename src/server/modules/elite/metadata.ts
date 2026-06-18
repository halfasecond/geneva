import axios from 'axios';
import { decode } from 'js-base64';
import Contracts from './contracts';

export interface VechMetadata {
    name?: string;
    description?: string;
    image?: string;
    animation_url?: string;
    background_color?: string;
    [key: string]: unknown;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** ERC-721 tokenId is the on-chain index; shipId is the procedural hull id in metadata/asset paths. */
export const parseShipId = (metadata: VechMetadata, tokenURI?: string): number | undefined => {
    const fromPath = (url: string, pattern: RegExp) => {
        const match = String(url).match(pattern);
        return match ? Number(match[1]) : undefined;
    };

    if (metadata.animation_url) {
        const id = fromPath(metadata.animation_url, /\/vechs\/(\d+)\//);
        if (id !== undefined) return id;
    }
    if (metadata.image) {
        const id = fromPath(metadata.image, /\/vechs\/(\d+)\//);
        if (id !== undefined) return id;
    }
    if (tokenURI) {
        const id = fromPath(tokenURI, /\/metadata\/(\d+)/);
        if (id !== undefined) return id;
    }
    if (metadata.name) {
        const match = String(metadata.name).match(/\b(\d+)\s*$/);
        if (match) return Number(match[1]);
    }
    return undefined;
};

export const applyVechMetadata = (
    target: Record<string, unknown>,
    metadata: VechMetadata,
    tokenURI?: string,
): void => {
    const { name, description, image, animation_url, background_color, attributes } = metadata as VechMetadata & {
        attributes?: { trait_type?: string; value?: unknown }[];
    };

    if (name) target.name = name;
    if (description) target.description = description;
    if (image) target.image = image;
    if (animation_url) target.animation_url = animation_url;
    if (background_color) target.background_color = background_color;

    if (Array.isArray(attributes)) {
        target.attributes = attributes.map((attr) => ({
            trait_type: attr.trait_type,
            value: attr.value,
        }));
    }

    const shipId = parseShipId(metadata, tokenURI);
    if (shipId !== undefined) {
        target.shipId = shipId;
    }
};

export const resolveTokenMetadata = async (uri: string): Promise<VechMetadata | null> => {
    const normalized = String(uri).trim();
    if (!normalized) return null;

    if (normalized.startsWith('data:application/json;base64,')) {
        return JSON.parse(decode(normalized.split(',')[1])) as VechMetadata;
    }

    if (normalized.startsWith('data:application/json,')) {
        return JSON.parse(decodeURIComponent(normalized.slice('data:application/json,'.length))) as VechMetadata;
    }

    if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                const { data } = await axios.get<VechMetadata>(normalized, {
                    timeout: 15000,
                    headers: { Accept: 'application/json' },
                });
                return data;
            } catch (error) {
                if (attempt === 2) throw error;
                await sleep(250 * (attempt + 1));
            }
        }
    }

    console.warn('vech metadata: unsupported tokenURI scheme', normalized.slice(0, 120));
    return null;
};

export const fetchVechTokenMetadata = async (
    web3: any,
    tokenId: number,
): Promise<Record<string, unknown> | null> => {
    const contract = new web3.eth.Contract(Contracts.Core.abi, Contracts.Core.addr);
    let uri: string | null = null;

    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const raw = await contract.methods.tokenURI(tokenId).call();
            uri = String(raw).trim();
            break;
        } catch (error) {
            if (attempt === 2) {
                console.error(`vech tokenURI #${tokenId} failed:`, error);
                return null;
            }
            await sleep(200 * (attempt + 1));
        }
    }

    if (!uri) return null;

    const patch: Record<string, unknown> = { tokenURI: uri };

    try {
        const metadata = await resolveTokenMetadata(uri);
        if (!metadata) {
            console.warn(`vech metadata #${tokenId}: empty response from ${uri}`);
            return null;
        }
        applyVechMetadata(patch, metadata, uri);
        return patch;
    } catch (error) {
        console.error(`vech metadata #${tokenId} fetch failed (${uri}):`, error);
        return null;
    }
};

export const enrichEventFromTokenUri = async (event: Record<string, unknown>, uri: string): Promise<void> => {
    event.tokenURI = String(uri).trim();
    const metadata = await resolveTokenMetadata(event.tokenURI as string);
    if (metadata) {
        applyVechMetadata(event, metadata, event.tokenURI as string);
    }
};