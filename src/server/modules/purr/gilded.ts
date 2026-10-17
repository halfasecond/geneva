import { readFileSync } from 'fs';
import { join } from 'path';
import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';
import { Web3 } from 'web3';

// Leaf is keccak256(abi.encode(uint256 id)), pairs sorted. Same encoding as PurrClaim2.isGilded.
const EXPECTED_ROOT = '0x95f90afe1c8941379e7936dd7f21808ba117bd97c48c9384c838e3e1b9e59191';

const web3 = new Web3();

const createLeaf = (kittyId: number): Buffer => {
    const encoded = web3.eth.abi.encodeParameter('uint256', kittyId);
    const hash = keccak256(encoded);
    return Buffer.from(hash.toString('hex'), 'hex');
};

const gildedIds = JSON.parse(readFileSync(join(__dirname, 'data', 'gilded.json'), 'utf8')) as number[];

const tree = new MerkleTree(gildedIds.map(createLeaf), keccak256, { sortPairs: true });
const root = tree.getHexRoot();

if (root !== EXPECTED_ROOT) {
    throw new Error(`[purr] gilded merkle root ${root} does not match ${EXPECTED_ROOT}`);
}

const proofs: Record<string, string[]> = {};
for (const id of gildedIds) {
    proofs[String(id)] = tree.getHexProof(createLeaf(id));
}

export const GILDED_ROOT = root;
export const GILDED_COUNT = gildedIds.length;

export const gildedProof = (tokenId: number): string[] | undefined => proofs[String(tokenId)];

export const verifyGildedProof = (tokenId: number, proof: string[]): boolean => {
    const leaf = createLeaf(tokenId);
    return tree.verify(proof, leaf, tree.getRoot());
};
