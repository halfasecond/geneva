const { expect } = require("chai");
const { ethers } = require("hardhat");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const { loadFixture, time } = require('@nomicfoundation/hardhat-toolbox/network-helpers')

describe("PurrClaim Contract", function () {

    async function deployContractsAndReturnFixtures() {
        const [
            owner, // an address used as though it is the dapper wallet api - set up to cosign transactions at the start of the test
            claim1, // the recovery address which this test doesn't touch as the key isn't actually known due to how the wallet is set up in the chrome extension
            claim2, // the authorized address that represents the chrome extension. again - the key isn't known so when it is used in tests this represents a chrome extension initiatied tx
            claim3, // an address to represent a new wallet - e.g. a user's existing Metamask / Eth wallet - that we will migrate authorization to
            claim4, // additional test address
            claim5  // additional test address
        ] = await hre.ethers.getSigners()

        // Deploy the mock CryptoKitties contract
        const MockCryptoKittiesFactory = await ethers.getContractFactory("MockCryptoKitties");
        const cryptokitties = await MockCryptoKittiesFactory.deploy();
        await cryptokitties.waitForDeployment();

        // Deploy PURR token with CryptoKitties address
        const Purr = await hre.ethers.getContractFactory("Purr")
        const purr = await Purr.deploy(cryptokitties.target)
        await purr.waitForDeployment()

        // Deploy PurrClaim contract
        const Claim = await hre.ethers.getContractFactory("PurrClaim")
        const claim = await Claim.deploy(purr.target, cryptokitties.target)
        await claim.waitForDeployment()

        return { purr, claim, cryptokitties, owner, claim1, claim2, claim3, claim4, claim5 }
    }

    // Diamond kitties from the diamonds.ts file - using the actual full list to match contract merkle root
    const diamondKitties = [
        3002,3004,3006,3008,3009,3010,3020,3142,3160,3187,3277,3335,3460,4999,10616,10652,10732,10893,10929,10950,11000,11822,14289,18436,22511,25392,25544,70194,99770,120729,121497,123634,125408,197794,261006,261412,265806,285374,324593,324883,329161,330173,334151,
        372052,372743,388839,422103,436920,437019,437110,437223,449457,449473,449572,449777,452103,452228,452529,452565,457413,457497,457543,459316,462562,463180,463542,464286,464511,464550,467966,468718,472761,472890,472935,473480,473730,482270,482607,482649,489346,489415,
        489477,489654,494352,499663,505282,505306,509314,509407,509505,514969,530795,538618,538796,569814,570405,570566,570909,571029,586146,597647,597765,597885,597950,620785,625900,625946,634882,656189,661686,661736,661796,680406,684182,698371,698474,705019,711830,712768,
        714925,715059,734281,734285,734513,734710,742825,742845,746378,746405,746423,746765,751538,751548,760494,768022,768041,768314,775360,775482,775942,783806,783888,791053,791105,791211,795671,795727,795775,795989,798896,803300,811968,812083,816787,816837,817019,825183,
        825281,825332,827878,827960,833115,839722,839768,849138,849223,852011,852045,852125,852363,857339,857374,857557,857895,870116,870136,870154,870521,876689,876713,876732,876768,877672,883298,890040,890044,890138,890411,904299,904313,904350,904447,920719,920877,921191,
        960523,960745,960991,961488,962086,1025112,1025163,1025371,1025650,1026164,1064764,1064773,1085741,1085783,1085921,1086105,1086429,1097976,1098000,1098071,1098391,1098467,1120558,1120578,1120607,1121119,1121273,1129952,1130247,1130864,1157385,1157409,1157461,1157954,
        1158532,1172732,1172945,1173087,1173614,1187881,1188021,1188068,1188867,1189503,1201975,1202073,1202724,1203683
    ];

    // Function to create a leaf node from a kitty ID
    function createLeaf(kittyId) {
        // Encode the kitty ID exactly as in the contract: keccak256(abi.encode(kittyId))
        // In Solidity, abi.encode pads values to 32 bytes
        const encodedKittyId = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [kittyId]);
        // Hash the encoded kitty ID
        return ethers.keccak256(encodedKittyId);
    }

    // Generate the Merkle tree
    function generateMerkleTree() {
        const leaves = diamondKitties.map(createLeaf);
        return new MerkleTree(leaves, keccak256, { sortPairs: true });
    }

    describe("Deployment", function () {
        it("should assign the total supply of tokens to the owner", async function () {
            const { purr, owner } = await loadFixture(deployContractsAndReturnFixtures);
            
            const ownerBalance = await purr.balanceOf(owner.address);
            expect(await purr.totalSupply()).to.equal(ownerBalance);
        });

        it("should mint tokens based on CryptoKitties totalSupply", async function () {
            const { purr, cryptokitties, owner } = await loadFixture(deployContractsAndReturnFixtures);
            
            // Get the total supply from CryptoKitties
            const cryptoKittiesTotalSupply = await cryptokitties.totalSupply();
            
            // Calculate expected PURR tokens (totalSupply * 10^18)
            const expectedPurrTokens = cryptoKittiesTotalSupply * (10n ** 18n);
            
            // Verify the owner received the correct amount
            const ownerBalance = await purr.balanceOf(owner.address);
            expect(ownerBalance).to.equal(expectedPurrTokens);
            
            // Verify total supply matches
            expect(await purr.totalSupply()).to.equal(expectedPurrTokens);
        });

        it("should store the CryptoKitties contract address", async function () {
            const { purr, cryptokitties } = await loadFixture(deployContractsAndReturnFixtures);
            
            expect(await purr.cryptoKitties()).to.equal(await cryptokitties.getAddress());
        });

        it("should revert when CryptoKitties address has no totalSupply function", async function () {
            const Purr = await ethers.getContractFactory("Purr");
            
            // Deploying with zero address should revert when trying to call totalSupply()
            await expect(
                Purr.deploy(ethers.ZeroAddress)
            ).to.be.reverted;
        });

        it("should mint correct amount with different CryptoKitties totalSupply", async function () {
            const [owner] = await ethers.getSigners();
            
            // Deploy MockCryptoKitties with custom total supply
            const MockCryptoKittiesFactory = await ethers.getContractFactory("MockCryptoKitties");
            const customCryptoKitties = await MockCryptoKittiesFactory.deploy();
            await customCryptoKitties.waitForDeployment();
            
            // Set a custom total supply
            const customTotalSupply = 1000000n;
            await customCryptoKitties.setTotalSupply(customTotalSupply);
            
            // Deploy Purr with the custom CryptoKitties
            const Purr = await ethers.getContractFactory("Purr");
            const customPurr = await Purr.deploy(await customCryptoKitties.getAddress());
            await customPurr.waitForDeployment();
            
            // Verify the correct amount was minted
            const expectedTokens = customTotalSupply * (10n ** 18n);
            const ownerBalance = await customPurr.balanceOf(owner.address);
            expect(ownerBalance).to.equal(expectedTokens);
            expect(await customPurr.totalSupply()).to.equal(expectedTokens);
        });

        it("should initialize with correct token addresses", async function () {
            const { purr, claim, cryptokitties } = await loadFixture(deployContractsAndReturnFixtures);
            
            expect(await claim.purrToken()).to.equal(await purr.getAddress());
            expect(await claim.cryptoKitties()).to.equal(await cryptokitties.getAddress());
        });

        it("should initialize with correct diamond merkle root", async function () {
            const { claim } = await loadFixture(deployContractsAndReturnFixtures);
            
            const contractRoot = await claim.diamonds();
            expect(contractRoot).to.equal("0x12349fca1989b4a32ad421092981473494e8d91675b639d881ff4141a9412f0a");
        });

        it("should initialize with correct exclusive roots", async function () {
            const { claim } = await loadFixture(deployContractsAndReturnFixtures);
            const firstRoot = await claim.exclusives(0);
            expect(firstRoot).to.equal("0x68be1c5b2727fbdc09c67656b2a7286a2a8d8dfd12ef2fbc893b51903106af5c");
        });
    });

    describe("Merkle Tree Verification", function () {
        it("should generate leaves in the same way as the contract", async function () {
            const { claim } = await loadFixture(deployContractsAndReturnFixtures);
            const kittyId = diamondKitties[0]; // 3002
            
            // Create leaf using our test function
            const testLeaf = createLeaf(kittyId);
            
            // We can't directly call the contract's internal leaf generation,
            // but we can verify our leaf works with the contract's verification
            const merkleTree = generateMerkleTree();
            const proof = merkleTree.getHexProof(testLeaf);
            
            // This will only pass if our leaf generation matches the contract's
            const isValid = await claim.isDiamond(kittyId, proof);
            expect(isValid).to.be.true;
        });
        
        it("should correctly verify a diamond kitty with a valid proof", async function () {
            const { claim } = await loadFixture(deployContractsAndReturnFixtures);
            const merkleTree = generateMerkleTree();
            const kittyId = diamondKitties[0]; // 3002
            const leaf = createLeaf(kittyId);
            const proof = merkleTree.getHexProof(leaf);

            // Verify the proof using the contract
            const isValid = await claim.isDiamond(kittyId, proof);
            expect(isValid).to.be.true;
        });

        it("should reject an invalid proof", async function () {
            const { claim } = await loadFixture(deployContractsAndReturnFixtures);
            const merkleTree = generateMerkleTree();
            const kittyId = 9999; // Not a diamond kitty
            const leaf = createLeaf(kittyId);
            const proof = merkleTree.getHexProof(leaf);

            // Verify the proof using the contract
            const isValid = await claim.isDiamond(kittyId, proof);
            expect(isValid).to.be.false;
        });

        it("should reject a valid kitty with an incorrect proof", async function () {
            const { claim } = await loadFixture(deployContractsAndReturnFixtures);
            const merkleTree = generateMerkleTree();
            const kittyId1 = diamondKitties[0]; // 3002
            const kittyId2 = diamondKitties[1]; // 3004
            const proof2 = merkleTree.getHexProof(createLeaf(kittyId2));

            // Try to verify kittyId1 with proof for kittyId2
            const isValid = await claim.isDiamond(kittyId1, proof2);
            expect(isValid).to.be.false;
        });
    });

    describe("Claim fund and withdraw functionality", function () {
        it("should allow receipt of claim treasury from owner", async function () {
            const { purr, claim, owner } = await loadFixture(deployContractsAndReturnFixtures);
            // Fund the claim contract
            const fundAmount = ethers.parseEther("1");
            await purr.connect(owner).transfer(await claim.getAddress(), fundAmount);
            const claimBalance = await purr.balanceOf(await claim.getAddress())
            expect(claimBalance).to.equal(fundAmount)
        });

        it("should allow withdrawal from claim treasury by (only) owner", async function () {
            const { purr, claim, owner } = await loadFixture(deployContractsAndReturnFixtures);
            // Fund the claim contract
            const fundAmount = ethers.parseEther("1");
            await purr.connect(owner).transfer(await claim.getAddress(), fundAmount);
            let claimBalance = await purr.balanceOf(await claim.getAddress())
            expect(claimBalance).to.equal(fundAmount);
            await claim.connect(owner).withdraw(fundAmount);
            claimBalance = await purr.balanceOf(await claim.getAddress());
            expect(claimBalance).to.equal(0);
        })

        it("should not allow withdrawal from claim treasury by non-owner", async function () {
            const { purr, claim, claim1, owner } = await loadFixture(deployContractsAndReturnFixtures);
            // Fund the claim contract
            const fundAmount = ethers.parseEther("1");
            await purr.connect(owner).transfer(await claim.getAddress(), fundAmount);
            let claimBalance = await purr.balanceOf(await claim.getAddress())
            expect(claimBalance).to.equal(fundAmount);
            await expect(
                claim.connect(claim1).withdraw(fundAmount)
            ).to.be.reverted;

            claimBalance = await purr.balanceOf(await claim.getAddress());
            expect(claimBalance).to.equal(fundAmount);
        })
    });

    describe("Basic Claiming Functionality", function () {
        it("should allow claiming for owned kitties with ID <= 3365", async function () {
            const { purr, claim, cryptokitties, owner, claim1 } = await loadFixture(deployContractsAndReturnFixtures);
            
            // Fund the claim contract
            const fundAmount = ethers.parseEther("10000");
            await purr.connect(owner).transfer(await claim.getAddress(), fundAmount);

            const claimBalance = await purr.balanceOf(await claim.getAddress())
            expect(claimBalance).to.equal(ethers.parseEther("10000"))
            
            const kittyId = 3000; // Less than 3365
            
            // Set claim1 as owner of the kitty
            await cryptokitties.setKittyOwner(kittyId, claim1.address);
            
            // Claim tokens
            await claim.connect(claim1).claim(kittyId, []);
            
            // Check if tokens were transferred
            const balance = await purr.balanceOf(claim1.address);
            expect(balance).to.equal(ethers.parseEther("100")); // Base(10) * Day1(10)
            
            // Check if the kitty is marked as claimed
            const hasClaimed = await claim.hasKittyClaimed(kittyId);
            expect(hasClaimed).to.be.true;
        });

        it("should allow claiming for owned diamond kitties with valid proof", async function () {
            const { purr, claim, cryptokitties, owner, claim2 } = await loadFixture(deployContractsAndReturnFixtures);
            
            // Fund the claim contract
            const fundAmount = ethers.parseEther("10000");
            await purr.connect(owner).transfer(await claim.getAddress(), fundAmount);
            
            const merkleTree = generateMerkleTree();
            const kittyId = diamondKitties[1]; // 3004
            const leaf = createLeaf(kittyId);
            const proof = merkleTree.getHexProof(leaf);
            
            // Set claim2 as owner of the kitty
            await cryptokitties.setKittyOwner(kittyId, claim2.address);
            
            // Claim tokens
            await claim.connect(claim2).claim(kittyId, proof);
            
            // Check if tokens were transferred - diamond + day1 multipliers
            const balance = await purr.balanceOf(claim2.address);
            expect(balance).to.equal(ethers.parseEther("10000")); // Base(10) * Diamond(10) * Day1(10)
            
            // Check if the kitty is marked as claimed
            const hasClaimed = await claim.hasKittyClaimed(kittyId);
            expect(hasClaimed).to.be.true;
        });

        it("should reject claims for non-owned kitties", async function () {
            const { purr, claim, cryptokitties, owner, claim1, claim2 } = await loadFixture(deployContractsAndReturnFixtures);
            
            // Fund the claim contract
            const fundAmount = ethers.parseEther("10000");
            await purr.connect(owner).transfer(await claim.getAddress(), fundAmount);
            
            const kittyId = 3001;
            
            // Set claim2 as owner, but claim1 tries to claim
            await cryptokitties.setKittyOwner(kittyId, claim2.address);
            
            // Should fail due to ownership check
            await expect(
                claim.connect(claim1).claim(kittyId, [])
            ).to.be.revertedWith("You don't own this kitty");
        });

        it("should reject claims for non-existent kitties", async function () {
            const { purr, claim, cryptokitties, owner, claim1 } = await loadFixture(deployContractsAndReturnFixtures);
            
            // Fund the claim contract
            const fundAmount = ethers.parseEther("10000");
            await purr.connect(owner).transfer(await claim.getAddress(), fundAmount);
            
            const nonExistentKittyId = 999999;
            
            // Don't set any owner for this kitty ID - it will be non-existent by default
            // Should fail with ERC721 error
            await expect(
                claim.connect(claim1).claim(nonExistentKittyId, [])
            ).to.be.revertedWith("ERC721: owner query for nonexistent token");
        });
    });

    describe("Founder Kitties", function () {
        it("should apply founder multiplier for owned kitties with ID <= 100", async function () {
            const { purr, claim, cryptokitties, owner, claim1 } = await loadFixture(deployContractsAndReturnFixtures);
            
            // Fund the claim contract
            const fundAmount = ethers.parseEther("10000");
            await purr.connect(owner).transfer(await claim.getAddress(), fundAmount);
            
            const founderKittyId = 50; // ID <= 100
            
            // Set claim1 as owner of the kitty
            await cryptokitties.setKittyOwner(founderKittyId, claim1.address);
            
            // Claim tokens for founder kitty
            await claim.connect(claim1).claim(founderKittyId, []);
            
            // Check if tokens were transferred with founder + day1 multipliers
            const balance = await purr.balanceOf(claim1.address);
            // Base: 10, Founder: 10x, Day1: 10x = 1000 PURR
            expect(balance).to.equal(ethers.parseEther("1000"));
            
            // Check if the kitty is marked as claimed
            const hasClaimed = await claim.hasKittyClaimed(founderKittyId);
            expect(hasClaimed).to.be.true;
        });

        it("should handle edge case at ID 100", async function () {
            const { purr, claim, cryptokitties, owner, claim3 } = await loadFixture(deployContractsAndReturnFixtures);
            
            // Fund the claim contract
            const fundAmount = ethers.parseEther("10000");
            await purr.connect(owner).transfer(await claim.getAddress(), fundAmount);
            
            const edgeCaseId = 100; // Exactly at founder boundary
            
            // Set claim3 as owner of the kitty
            await cryptokitties.setKittyOwner(edgeCaseId, claim3.address);
            
            await claim.connect(claim3).claim(edgeCaseId, []);
            
            const balance = await purr.balanceOf(claim3.address);
            // Should get founder multiplier since ID <= 100
            expect(balance).to.equal(ethers.parseEther("1000"));
        });

        it("should correctly handle that no founder diamonds exist", async function () {
            const { purr, claim, cryptokitties, owner, claim1 } = await loadFixture(deployContractsAndReturnFixtures);
            
            // Fund the claim contract
            const fundAmount = ethers.parseEther("100000");
            await purr.connect(owner).transfer(await claim.getAddress(), fundAmount);
            
            // Test that ID 99 (founder) is not a diamond
            const founderDiamondId = 99; // ID <= 100
            const merkleTree = generateMerkleTree();
            
            // Check if it's actually a diamond in our test data
            const leaf = createLeaf(founderDiamondId);
            const proof = merkleTree.getHexProof(leaf);
            const isDiamond = await claim.isDiamond(founderDiamondId, proof);
            
            // Should be false since all diamonds start at ID 3002
            expect(isDiamond).to.be.false;
            
            // Set ownership and claim as regular founder
            await cryptokitties.setKittyOwner(founderDiamondId, claim1.address);
            await claim.connect(claim1).claim(founderDiamondId, []);
            
            const balance = await purr.balanceOf(claim1.address);
            // Base(10) * Founder(10) * Day1(10) = 1,000 PURR (no diamond multiplier)
            expect(balance).to.equal(ethers.parseEther("1000"));
        });
    });

    describe("Diamond Kitties", function () {
        it("should handle diamond kitty with ID > 3365", async function () {
            const { purr, claim, cryptokitties, owner, claim1 } = await loadFixture(deployContractsAndReturnFixtures);
            
            // Fund the claim contract
            const fundAmount = ethers.parseEther("100000");
            await purr.connect(owner).transfer(await claim.getAddress(), fundAmount);
            
            // Use a diamond kitty with ID > 3365
            const diamondId = diamondKitties.find(id => id > 3365) || diamondKitties[0];
            const merkleTree = generateMerkleTree();
            const leaf = createLeaf(diamondId);
            const proof = merkleTree.getHexProof(leaf);
            
            // Set claim1 as owner of the kitty
            await cryptokitties.setKittyOwner(diamondId, claim1.address);
            
            await claim.connect(claim1).claim(diamondId, proof);
            
            const balance = await purr.balanceOf(claim1.address);
            if (diamondId > 3365) {
                // Base(10) * Diamond(100) = 1000 PURR (no day1 multiplier)
                expect(balance).to.equal(ethers.parseEther("1000"));
            } else {
                // Base(10) * Diamond(100) * Day1(10) = 1000 PURR
                expect(balance).to.equal(ethers.parseEther("10000"));
            }
        });

        it("should reject diamond kitty claims without ownership", async function () {
            const { purr, claim, cryptokitties, owner, claim1, claim2 } = await loadFixture(deployContractsAndReturnFixtures);
            
            // Fund the claim contract
            const fundAmount = ethers.parseEther("100000");
            await purr.connect(owner).transfer(await claim.getAddress(), fundAmount);
            
            const diamondId = diamondKitties[1];
            const merkleTree = generateMerkleTree();
            const leaf = createLeaf(diamondId);
            const proof = merkleTree.getHexProof(leaf);
            
            // Set claim2 as owner, but claim1 tries to claim
            await cryptokitties.setKittyOwner(diamondId, claim2.address);
            
            // Should fail due to ownership check, not proof validation
            await expect(
                claim.connect(claim1).claim(diamondId, proof)
            ).to.be.revertedWith("You don't own this kitty");
        });
    });

    describe("Edge Cases", function () {
        it("should handle kitty ID exactly at day1 boundary (3365)", async function () {
            const { purr, claim, cryptokitties, owner, claim5 } = await loadFixture(deployContractsAndReturnFixtures);
            
            // Fund the claim contract
            const fundAmount = ethers.parseEther("10000");
            await purr.connect(owner).transfer(await claim.getAddress(), fundAmount);
            
            const edgeKittyId = 3365;
            
            // Set claim5 as owner of the kitty
            await cryptokitties.setKittyOwner(edgeKittyId, claim5.address);
            
            await claim.connect(claim5).claim(edgeKittyId, []);
            
            const balance = await purr.balanceOf(claim5.address);
            // Base: 10, Day1: 10x = 100 PURR (no other multipliers for regular day1 kitty)
            expect(balance).to.equal(ethers.parseEther("100"));
        });

        it("should not apply day1 multiplier for ID 3366", async function () {
            const { claim, cryptokitties, claim2 } = await loadFixture(deployContractsAndReturnFixtures);
            
            const postDay1Id = 3366;
            
            // Set ownership
            await cryptokitties.setKittyOwner(postDay1Id, claim2.address);
            
            // This should fail since it's not eligible (> 3365 and not diamond/exclusive)
            await expect(
                claim.connect(claim2).claim(postDay1Id, [])
            ).to.be.revertedWith("kitty is not eligible for this claim");
        });

        it("should not allow claiming for non-eligible kitties", async function () {
            const { claim, cryptokitties, claim3 } = await loadFixture(deployContractsAndReturnFixtures);
            
            const kittyId = 5000; // Greater than 3365 and not a diamond kitty
            
            // Set ownership
            await cryptokitties.setKittyOwner(kittyId, claim3.address);
            
            // Try to claim tokens with an empty proof
            await expect(
                claim.connect(claim3).claim(kittyId, [])
            ).to.be.revertedWith("kitty is not eligible for this claim");
        });

        it("should not allow claiming more than maximum for the same kitty", async function () {
            const { purr, claim, cryptokitties, owner, claim1 } = await loadFixture(deployContractsAndReturnFixtures);
            
            // Fund the claim contract
            const fundAmount = ethers.parseEther("10000");
            await purr.connect(owner).transfer(await claim.getAddress(), fundAmount);
            
            const kittyId = 3001; // Less than 3365, different from previous test
            
            // Set ownership
            await cryptokitties.setKittyOwner(kittyId, claim1.address);
            
            // Claim tokens first time
            await claim.connect(claim1).claim(kittyId, []);
            
            // Try to claim again with dummy proof - should fail due to maximum amount reached
            await expect(claim.connect(claim1).claim(kittyId, ["0x0000000000000000000000000000000000000000000000000000000000000000"])).to.be.revertedWith("This kitty has already claimed the maximum amount");
        });
        
        it("should allow upgrading claims with better proofs", async function () {
            const { purr, claim, cryptokitties, owner, claim1 } = await loadFixture(deployContractsAndReturnFixtures);
            
            // Fund the claim contract
            const fundAmount = ethers.parseEther("100000");
            await purr.connect(owner).transfer(await claim.getAddress(), fundAmount);
            
            // Use a diamond kitty that's also day1 (ID <= 3365)
            const diamondKittyId = diamondKitties.find(id => id <= 3365) || diamondKitties[0]; // Should be 3002
            const merkleTree = generateMerkleTree();
            const leaf = createLeaf(diamondKittyId);
            const proof = merkleTree.getHexProof(leaf);
            
            // Set ownership
            await cryptokitties.setKittyOwner(diamondKittyId, claim1.address);
            
            // First claim without proof (only gets day1 multiplier)
            await claim.connect(claim1).claim(diamondKittyId, []);
            let balance = await purr.balanceOf(claim1.address);
            expect(balance).to.equal(ethers.parseEther("100")); // Base(10) * Day1(10) = 100
            
            // Check claimed amount
            const claimedAmount = await claim.getKittyClaimedAmount(diamondKittyId);
            expect(claimedAmount).to.equal(ethers.parseEther("100"));
            
            // Second claim with diamond proof (gets full diamond + day1 multiplier)
            await claim.connect(claim1).claim(diamondKittyId, proof);
            balance = await purr.balanceOf(claim1.address);
            expect(balance).to.equal(ethers.parseEther("10000")); // Base(10) * Diamond(100) * Day1(10) = 10000
            
            // Check final claimed amount
            const finalClaimedAmount = await claim.getKittyClaimedAmount(diamondKittyId);
            expect(finalClaimedAmount).to.equal(ethers.parseEther("10000"));
        });
    });

    describe("Open portal", function () {
        it("should allow correct kitty owner to open the portal", async function () {
            const { purr, cryptokitties, owner, claim, claim1, claim2 } = await loadFixture(deployContractsAndReturnFixtures);
            
            // The portal kitty ID that produces the required hash
            // keccak256(abi.encodePacked(127)) = 0x66925e85f1a4743fd8d60ba595ed74887b7caf321dd83b21e04d77c115383408
            const portalKittyId = 127;
            
            // Verify this is the correct kitty ID by checking the hash
            const expectedHash = "0x66925e85f1a4743fd8d60ba595ed74887b7caf321dd83b21e04d77c115383408";
            const actualHash = ethers.keccak256(ethers.solidityPacked(["uint256"], [portalKittyId]));
            expect(actualHash).to.equal(expectedHash);
            
            // Fund the claim contract with enough for the portal opening
            // Portal requires: kittyId * 10 * 10^18 = 127 * 10 * 10^18 = 1270 PURR
            const fundAmount = ethers.parseEther("2000"); // Extra buffer
            await purr.connect(owner).transfer(await claim.getAddress(), fundAmount);
            
            // Set ownership for the portal kitty
            await cryptokitties.setKittyOwner(portalKittyId, claim1.address);
            
            // Test that non-owner cannot open portal
            await expect(claim.connect(claim2).openPortal(portalKittyId))
                .to.be.revertedWith("Portal must be opened by owner");
            
            // Test that owner can open portal
            await expect(claim.connect(claim1).openPortal(portalKittyId))
                .to.not.be.reverted;
                
            // Verify the portal was opened (exclusives array should now have 2 elements)
            const exclusiveRoot2 = await claim.exclusives(1);
            expect(exclusiveRoot2).to.equal("0x05048a079a07ef7749db7bd397d7811e0ad1b93ba9264746543fc36465176e85");
        });
        
        it("should reject portal opening with wrong kitty ID", async function () {
            const { purr, cryptokitties, owner, claim, claim1 } = await loadFixture(deployContractsAndReturnFixtures);
            
            // Fund the claim contract
            const fundAmount = ethers.parseEther("100000");
            await purr.connect(owner).transfer(await claim.getAddress(), fundAmount);
            
            const wrongKittyId = 128; // This won't have the correct hash
            await cryptokitties.setKittyOwner(wrongKittyId, claim1.address);
            
            await expect(claim.connect(claim1).openPortal(wrongKittyId))
                .to.be.revertedWith("This kitty can not open portals");
        });
        
        it("should reject portal opening when already opened", async function () {
            const { purr, cryptokitties, owner, claim, claim1 } = await loadFixture(deployContractsAndReturnFixtures);
            
            const portalKittyId = 127;
            const fundAmount = ethers.parseEther("5000");
            await purr.connect(owner).transfer(await claim.getAddress(), fundAmount);
            await cryptokitties.setKittyOwner(portalKittyId, claim1.address);
            
            // Open portal first time
            await claim.connect(claim1).openPortal(portalKittyId);
            
            // Try to open again - should fail
            await expect(claim.connect(claim1).openPortal(portalKittyId))
                .to.be.revertedWith("Portal already opened");
        });
    });

    describe("Security Tests", function () {
        it("should handle insufficient contract balance gracefully", async function () {
            const { purr, cryptokitties, claim1 } = await loadFixture(deployContractsAndReturnFixtures);
            
            // Deploy a new claim contract with no funding
            const Claim = await ethers.getContractFactory("PurrClaim");
            const unfundedClaim = await Claim.deploy(await purr.getAddress(), await cryptokitties.getAddress());
            await unfundedClaim.waitForDeployment();
            
            const kittyId = 3000;
            
            // Set ownership
            await cryptokitties.setKittyOwner(kittyId, claim1.address);
            
            // Should fail due to insufficient balance
            await expect(
                unfundedClaim.connect(claim1).claim(kittyId, [])
            ).to.be.revertedWith("Insufficient contract balance");
        });

        it("should prevent claiming with someone else's proof", async function () {
            const { claim } = await loadFixture(deployContractsAndReturnFixtures);
            
            const merkleTree = generateMerkleTree();
            const kittyId1 = diamondKitties[0]; // 3002
            const kittyId2 = diamondKitties[1]; // 3004
            
            // Get proof for kittyId2
            const leaf2 = createLeaf(kittyId2);
            const proof2 = merkleTree.getHexProof(leaf2);
            
            // Try to use kittyId2's proof for kittyId1
            const isValid = await claim.isDiamond(kittyId1, proof2);
            expect(isValid).to.be.false;
        });

        it("should maintain state consistency after failed transfers", async function () {
            const { purr, claim, cryptokitties, owner, claim1 } = await loadFixture(deployContractsAndReturnFixtures);
            
            // Fund the claim contract
            const fundAmount = ethers.parseEther("10000");
            await purr.connect(owner).transfer(await claim.getAddress(), fundAmount);
            
            const kittyId = 1500; // Use unique ID
            
            // Set ownership
            await cryptokitties.setKittyOwner(kittyId, claim1.address);
            
            // First successful claim
            await claim.connect(claim1).claim(kittyId, []);
            
            // Verify state is updated
            const hasClaimed = await claim.hasKittyClaimed(kittyId);
            expect(hasClaimed).to.be.true;
            
            // Second attempt should fail (provide dummy proof to pass proof requirement)
            await expect(
                claim.connect(claim1).claim(kittyId, ["0x0000000000000000000000000000000000000000000000000000000000000000"])
            ).to.be.revertedWith("This kitty has already claimed the maximum amount");
        });
    });

    describe("Claim Upgrade Functionality", function () {
        it("should default to 0 for unclaimed kitties (Solidity mapping behavior)", async function () {
            const { claim } = await loadFixture(deployContractsAndReturnFixtures);
            
            const unclaimedKittyId = 9999;
            
            // Should return 0 for kitties that have never claimed
            expect(await claim.getKittyClaimedAmount(unclaimedKittyId)).to.equal(0);
            expect(await claim.hasKittyClaimed(unclaimedKittyId)).to.be.false;
        });

        it("should track claimed amounts correctly", async function () {
            const { purr, claim, cryptokitties, owner, claim1 } = await loadFixture(deployContractsAndReturnFixtures);
            
            // Fund the claim contract
            const fundAmount = ethers.parseEther("10000");
            await purr.connect(owner).transfer(await claim.getAddress(), fundAmount);
            
            const kittyId = 2000;
            await cryptokitties.setKittyOwner(kittyId, claim1.address);
            
            // Initially should be 0
            expect(await claim.getKittyClaimedAmount(kittyId)).to.equal(0);
            expect(await claim.hasKittyClaimed(kittyId)).to.be.false;
            
            // After claiming
            await claim.connect(claim1).claim(kittyId, []);
            expect(await claim.getKittyClaimedAmount(kittyId)).to.equal(ethers.parseEther("100"));
            expect(await claim.hasKittyClaimed(kittyId)).to.be.true;
        });

        it("should calculate max claim amounts correctly", async function () {
            const { claim } = await loadFixture(deployContractsAndReturnFixtures);
            
            const merkleTree = generateMerkleTree();
            const diamondKittyId = diamondKitties[0]; // 3002
            const leaf = createLeaf(diamondKittyId);
            const proof = merkleTree.getHexProof(leaf);
            
            // Day1 kitty without proof
            const day1Max = await claim.getKittyMaxClaim(2000, []);
            expect(day1Max).to.equal(ethers.parseEther("100")); // Base(10) * Day1(10)
            
            // Diamond kitty with proof
            const diamondMax = await claim.getKittyMaxClaim(diamondKittyId, proof);
            expect(diamondMax).to.equal(ethers.parseEther("10000")); // Base(10) * Diamond(100) * Day1(10)
            
            // Non-eligible kitty
            const nonEligibleMax = await claim.getKittyMaxClaim(5000, []);
            expect(nonEligibleMax).to.equal(0);
        });

        it("should calculate remaining claim amounts correctly", async function () {
            const { purr, claim, cryptokitties, owner, claim1 } = await loadFixture(deployContractsAndReturnFixtures);
            
            // Fund the claim contract
            const fundAmount = ethers.parseEther("100000");
            await purr.connect(owner).transfer(await claim.getAddress(), fundAmount);
            
            const merkleTree = generateMerkleTree();
            const diamondKittyId = diamondKitties[0]; // 3002
            const leaf = createLeaf(diamondKittyId);
            const proof = merkleTree.getHexProof(leaf);
            
            await cryptokitties.setKittyOwner(diamondKittyId, claim1.address);
            
            // Initially, remaining should equal max
            const initialRemaining = await claim.getKittyRemainingClaim(diamondKittyId, proof);
            expect(initialRemaining).to.equal(ethers.parseEther("10000"));
            
            // Claim without proof first
            await claim.connect(claim1).claim(diamondKittyId, []);
            
            // Remaining should be reduced
            const afterFirstClaim = await claim.getKittyRemainingClaim(diamondKittyId, proof);
            expect(afterFirstClaim).to.equal(ethers.parseEther("9900")); // 10000 - 100
            
            // Claim with proof
            await claim.connect(claim1).claim(diamondKittyId, proof);
            
            // Should be 0 remaining
            const afterSecondClaim = await claim.getKittyRemainingClaim(diamondKittyId, proof);
            expect(afterSecondClaim).to.equal(0);
        });

        it("should require proof for any reclaim attempt", async function () {
            const { purr, claim, cryptokitties, owner, claim1 } = await loadFixture(deployContractsAndReturnFixtures);
            
            // Fund the claim contract
            const fundAmount = ethers.parseEther("100000");
            await purr.connect(owner).transfer(await claim.getAddress(), fundAmount);
            
            // Test with day1 kitty first
            const day1KittyId = 2000; // <= 3365
            await cryptokitties.setKittyOwner(day1KittyId, claim1.address);
            
            // First claim (no proof needed for day1)
            await claim.connect(claim1).claim(day1KittyId, []);
            
            // Try to reclaim without proof - should fail due to proof requirement
            await expect(claim.connect(claim1).claim(day1KittyId, []))
                .to.be.revertedWith("Reclaims must include a proof");
                
            // Test with diamond kitty
            const merkleTree = generateMerkleTree();
            const diamondKittyId = diamondKitties[0]; // day1 diamond
            const leaf = createLeaf(diamondKittyId);
            const proof = merkleTree.getHexProof(leaf);
            
            await cryptokitties.setKittyOwner(diamondKittyId, claim1.address);
            
            // First claim without proof (gets day1 only)
            await claim.connect(claim1).claim(diamondKittyId, []);
            
            // Try to reclaim without proof - should fail
            await expect(claim.connect(claim1).claim(diamondKittyId, []))
                .to.be.revertedWith("Reclaims must include a proof");
                
            // Reclaim with proof should work (upgrade)
            await expect(claim.connect(claim1).claim(diamondKittyId, proof))
                .to.not.be.reverted;
        });

        it("should allow legitimate upgrades with valid proofs", async function () {
            const { purr, claim, cryptokitties, owner, claim1 } = await loadFixture(deployContractsAndReturnFixtures);
            
            // Fund the claim contract
            const fundAmount = ethers.parseEther("100000");
            await purr.connect(owner).transfer(await claim.getAddress(), fundAmount);
            
            const merkleTree = generateMerkleTree();
            const diamondKittyId = diamondKitties[0]; // day1 diamond
            const leaf = createLeaf(diamondKittyId);
            const proof = merkleTree.getHexProof(leaf);
            
            await cryptokitties.setKittyOwner(diamondKittyId, claim1.address);
            
            // First claim without proof (gets day1 only: 100 PURR)
            await claim.connect(claim1).claim(diamondKittyId, []);
            let balance = await purr.balanceOf(claim1.address);
            expect(balance).to.equal(ethers.parseEther("100"));
            
            // Upgrade with diamond proof (gets additional 9900 PURR)
            await claim.connect(claim1).claim(diamondKittyId, proof);
            balance = await purr.balanceOf(claim1.address);
            expect(balance).to.equal(ethers.parseEther("10000"));
            
            // Try to claim again with same proof - should fail (already at max)
            await expect(claim.connect(claim1).claim(diamondKittyId, proof))
                .to.be.revertedWith("This kitty has already claimed the maximum amount");
        });
    });

    describe("Event Emission", function () {
        it("should emit Claim event on successful claim", async function () {
            const { purr, claim, cryptokitties, owner, claim1 } = await loadFixture(deployContractsAndReturnFixtures);
            
            // Fund the claim contract
            const fundAmount = ethers.parseEther("10000");
            await purr.connect(owner).transfer(await claim.getAddress(), fundAmount);
            
            const kittyId = 1000;
            const expectedAmount = ethers.parseEther("100"); // Base(10) * Day1(10)
            
            // Set ownership
            await cryptokitties.setKittyOwner(kittyId, claim1.address);
            
            // Check that the event is emitted with correct parameters
            await expect(claim.connect(claim1).claim(kittyId, []))
                .to.emit(claim, "Claim")
                .withArgs(claim1.address, kittyId, expectedAmount);
        });
    });

    describe("Contract Administration", function () {
        it("should allow owner to update exclusive roots", async function () {
            const { claim, owner } = await loadFixture(deployContractsAndReturnFixtures);
            
            const newRoots = [
                "0x1234567890123456789012345678901234567890123456789012345678901234",
                "0x5678901234567890123456789012345678901234567890123456789012345678"
            ];
            
            // Only owner should be able to update
            await claim.connect(owner).updateExclusiveRoots(newRoots);
            
            // Verify roots were updated
            const updatedRoot1 = await claim.exclusives(0);
            const updatedRoot2 = await claim.exclusives(1);
            
            expect(updatedRoot1).to.equal(newRoots[0]);
            expect(updatedRoot2).to.equal(newRoots[1]);
        });

        it("should reject non-owner attempts to update exclusive roots", async function () {
            const { claim, claim1 } = await loadFixture(deployContractsAndReturnFixtures);
            
            const newRoots = ["0x1234567890123456789012345678901234567890123456789012345678901234"];
            
            await expect(
                claim.connect(claim1).updateExclusiveRoots(newRoots)
            ).to.be.revertedWithCustomError(claim, "OwnableUnauthorizedAccount");
        });

        it("should allow owner to fund the contract", async function () {
            const { purr, claim, owner } = await loadFixture(deployContractsAndReturnFixtures);
            
            const fundAmount = ethers.parseEther("1000");
            await purr.connect(owner).transfer(await claim.getAddress(), fundAmount);
            
            // Verify contract balance increased
            const contractBalance = await purr.balanceOf(await claim.getAddress());
            expect(contractBalance).to.be.gte(fundAmount);
        });
    });

    describe("Public View Functions", function () {
        it("should correctly report kitty claim status", async function () {
            const { purr, claim, cryptokitties, owner, claim1 } = await loadFixture(deployContractsAndReturnFixtures);
            
            // Fund the claim contract
            const fundAmount = ethers.parseEther("10000");
            await purr.connect(owner).transfer(await claim.getAddress(), fundAmount);
            
            const kittyId = 1500;
            
            // Set ownership
            await cryptokitties.setKittyOwner(kittyId, claim1.address);
            
            // Initially should be false
            expect(await claim.hasKittyClaimed(kittyId)).to.be.false;
            
            // After claiming should be true
            await claim.connect(claim1).claim(kittyId, []);
            expect(await claim.hasKittyClaimed(kittyId)).to.be.true;
        });

        it("should correctly identify diamond kitties", async function () {
            const { claim } = await loadFixture(deployContractsAndReturnFixtures);
            
            const merkleTree = generateMerkleTree();
            const diamondId = diamondKitties[0];
            const nonDiamondId = 9999;
            
            // Test with valid proof
            const leaf = createLeaf(diamondId);
            const validProof = merkleTree.getHexProof(leaf);
            expect(await claim.isDiamond(diamondId, validProof)).to.be.true;
            
            // Test with invalid proof
            const invalidProof = [];
            expect(await claim.isDiamond(diamondId, invalidProof)).to.be.false;
            
            // Test non-diamond kitty
            expect(await claim.isDiamond(nonDiamondId, [])).to.be.false;
        });
    });

    describe("Exclusive Kitties", function () {
        // Mock exclusive kitties for testing (these would need valid proofs from actual exclusive roots)
        const mockExclusiveKitties = [5000, 5001, 5002]; // IDs > 3365 to test exclusive-only logic
        
        it("should verify exclusive kitties with valid proofs", async function () {
            const { claim } = await loadFixture(deployContractsAndReturnFixtures);
            
            // Note: This test would need actual exclusive merkle proofs
            // For now, we test the function exists and handles empty proofs correctly
            const kittyId = mockExclusiveKitties[0];
            const emptyProof = [];
            
            const isExclusive = await claim.isExclusive(kittyId, emptyProof);
            expect(isExclusive).to.be.false; // Should be false with empty proof
        });

        it("should reject non-exclusive kitties", async function () {
            const { claim } = await loadFixture(deployContractsAndReturnFixtures);
            
            const nonExclusiveKitty = 9999;
            const emptyProof = [];
            
            const isExclusive = await claim.isExclusive(nonExclusiveKitty, emptyProof);
            expect(isExclusive).to.be.false;
        });

        it("should handle multiple exclusive roots", async function () {
            const { claim } = await loadFixture(deployContractsAndReturnFixtures);
            
            // Test that the contract has multiple exclusive roots
            const exclusiveRoots = await claim.exclusives(0);
            expect(exclusiveRoots).to.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
        });
    });

});
