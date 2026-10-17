const fs = require("fs");
const path = require("path");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const { ethers } = require("ethers");

const dataDir = path.join(__dirname, "data");
const gildedIds = JSON.parse(fs.readFileSync(path.join(dataDir, "gilded.json"), "utf8"));
const gm = JSON.parse(fs.readFileSync(path.join(dataDir, "grandmasters.json"), "utf8"));
const summary = JSON.parse(fs.readFileSync(path.join(dataDir, "claim2-summary.json"), "utf8"));

function createLeaf(kittyId) {
    const encoded = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [kittyId]);
    return ethers.keccak256(encoded);
}

const leaves = gildedIds.map(createLeaf);
const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
const root = tree.getHexRoot();

const proofs = {};
for (const id of gildedIds) {
    proofs[String(id)] = tree.getHexProof(createLeaf(id));
}

summary.gildedRoot = root;
summary.gildedCount = gildedIds.length;
summary.uniqueGrandmasterAddresses = gm.uniqueHatchers.length;
summary.gildedPurr = gildedIds.length * 100;
summary.grandmasterPurrIfUniqueAddress = gm.uniqueHatchers.length * 1000;
summary.totalIfUniqueAddresses = summary.gildedPurr + summary.grandmasterPurrIfUniqueAddress;

fs.writeFileSync(path.join(dataDir, "claim2-summary.json"), JSON.stringify(summary, null, 2));
fs.writeFileSync(path.join(dataDir, "gilded-root.json"), JSON.stringify({ root, count: gildedIds.length }, null, 2));
fs.writeFileSync(path.join(dataDir, "gilded-proofs.json"), JSON.stringify(proofs));

console.log("gilded root", root);
console.log("gilded count", gildedIds.length);
console.log("unique grandmasters", gm.uniqueHatchers.length);
console.log("gilded $PURR", summary.gildedPurr);
console.log("grandmaster $PURR (unique addresses)", summary.grandmasterPurrIfUniqueAddress);
console.log("total unique", summary.totalIfUniqueAddresses);
console.log("sample proof length", proofs[String(gildedIds[0])].length);
