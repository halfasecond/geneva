const { expect } = require("chai");
const { ethers } = require("hardhat");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("PurrClaim2", function () {
    const gildedKitties = [3004, 308471, 457570, 1204777];

    function createLeaf(kittyId) {
        const encoded = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [kittyId]);
        return ethers.keccak256(encoded);
    }

    function generateMerkleTree(ids = gildedKitties) {
        const leaves = ids.map(createLeaf);
        return new MerkleTree(leaves, keccak256, { sortPairs: true });
    }

    async function deploy() {
        const [owner, gildedOwner, grandmaster, other] = await ethers.getSigners();

        const MockCryptoKittiesFactory = await ethers.getContractFactory("MockCryptoKitties");
        const cryptokitties = await MockCryptoKittiesFactory.deploy();
        await cryptokitties.waitForDeployment();

        const Purr = await ethers.getContractFactory("Purr");
        const purr = await Purr.deploy(cryptokitties.target);
        await purr.waitForDeployment();

        const tree = generateMerkleTree();
        const gildedRoot = tree.getHexRoot();

        const Claim = await ethers.getContractFactory("PurrClaim2");
        const claim = await Claim.deploy(
            purr.target,
            cryptokitties.target,
            gildedRoot,
            [grandmaster.address, grandmaster.address]
        );
        await claim.waitForDeployment();

        await purr.connect(owner).transfer(await claim.getAddress(), ethers.parseEther("250000"));

        return { purr, claim, cryptokitties, owner, gildedOwner, grandmaster, other, tree };
    }

    describe("deployment", function () {
        it("dedupes grandmaster addresses", async function () {
            const { claim, grandmaster } = await loadFixture(deploy);
            expect(await claim.grandmasterCount()).to.equal(1);
            expect(await claim.isGrandmaster(grandmaster.address)).to.equal(true);
            expect(await claim.grandmasters(0)).to.equal(grandmaster.address);
        });

        it("stores the gilded merkle root", async function () {
            const { claim, tree } = await loadFixture(deploy);
            expect(await claim.gildedRoot()).to.equal(tree.getHexRoot());
        });
    });

    describe("gilded claims", function () {
        it("pays 100 $PURR to the current owner of a proven gilded kitty", async function () {
            const { purr, claim, cryptokitties, gildedOwner, tree } = await loadFixture(deploy);
            const kittyId = gildedKitties[0];
            const proof = tree.getHexProof(createLeaf(kittyId));
            await cryptokitties.setKittyOwner(kittyId, gildedOwner.address);

            await claim.connect(gildedOwner).claimGilded(kittyId, proof);

            expect(await purr.balanceOf(gildedOwner.address)).to.equal(ethers.parseEther("100"));
            expect(await claim.gildedClaimed(kittyId)).to.equal(true);
        });

        it("rejects a second claim for the same kitty", async function () {
            const { claim, cryptokitties, gildedOwner, tree } = await loadFixture(deploy);
            const kittyId = gildedKitties[1];
            const proof = tree.getHexProof(createLeaf(kittyId));
            await cryptokitties.setKittyOwner(kittyId, gildedOwner.address);
            await claim.connect(gildedOwner).claimGilded(kittyId, proof);

            await expect(
                claim.connect(gildedOwner).claimGilded(kittyId, proof)
            ).to.be.revertedWith("Already claimed");
        });

        it("rejects a non-owner", async function () {
            const { claim, cryptokitties, gildedOwner, other, tree } = await loadFixture(deploy);
            const kittyId = gildedKitties[2];
            const proof = tree.getHexProof(createLeaf(kittyId));
            await cryptokitties.setKittyOwner(kittyId, gildedOwner.address);

            await expect(
                claim.connect(other).claimGilded(kittyId, proof)
            ).to.be.revertedWith("You don't own this kitty");
        });

        it("rejects a kitty that is not in the gilded tree", async function () {
            const { claim, cryptokitties, gildedOwner, tree } = await loadFixture(deploy);
            const kittyId = 1;
            const proof = tree.getHexProof(createLeaf(gildedKitties[0]));
            await cryptokitties.setKittyOwner(kittyId, gildedOwner.address);

            await expect(
                claim.connect(gildedOwner).claimGilded(kittyId, proof)
            ).to.be.revertedWith("Not a gilded kitty");
        });
    });

    describe("grandmaster claims", function () {
        it("pays 1000 $PURR once to a hatcher address", async function () {
            const { purr, claim, grandmaster } = await loadFixture(deploy);

            await claim.connect(grandmaster).claimGrandmaster();

            expect(await purr.balanceOf(grandmaster.address)).to.equal(ethers.parseEther("1000"));
            expect(await claim.grandmasterClaimed(grandmaster.address)).to.equal(true);
        });

        it("rejects a second grandmaster claim from the same address", async function () {
            const { claim, grandmaster } = await loadFixture(deploy);
            await claim.connect(grandmaster).claimGrandmaster();

            await expect(
                claim.connect(grandmaster).claimGrandmaster()
            ).to.be.revertedWith("Already claimed");
        });

        it("rejects a non-grandmaster", async function () {
            const { claim, other } = await loadFixture(deploy);
            await expect(
                claim.connect(other).claimGrandmaster()
            ).to.be.revertedWith("Not a grandmaster");
        });

        it("lets the owner add grandmasters later", async function () {
            const { purr, claim, owner, other } = await loadFixture(deploy);
            await claim.connect(owner).addGrandmasters([other.address, other.address, ethers.ZeroAddress]);

            expect(await claim.grandmasterCount()).to.equal(2);
            expect(await claim.isGrandmaster(other.address)).to.equal(true);

            await claim.connect(other).claimGrandmaster();
            expect(await purr.balanceOf(other.address)).to.equal(ethers.parseEther("1000"));
        });

        it("rejects non-owner addGrandmasters", async function () {
            const { claim, other } = await loadFixture(deploy);
            await expect(
                claim.connect(other).addGrandmasters([other.address])
            ).to.be.reverted;
        });
    });

    describe("withdraw", function () {
        it("lets the owner recover leftover $PURR", async function () {
            const { purr, claim, owner } = await loadFixture(deploy);
            const before = await purr.balanceOf(owner.address);
            await claim.connect(owner).withdraw(ethers.parseEther("1000"));
            expect(await purr.balanceOf(owner.address)).to.equal(before + ethers.parseEther("1000"));
        });

        it("rejects non-owner withdraw", async function () {
            const { claim, other } = await loadFixture(deploy);
            await expect(
                claim.connect(other).withdraw(ethers.parseEther("1"))
            ).to.be.reverted;
        });
    });
});
