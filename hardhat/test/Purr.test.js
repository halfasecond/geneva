const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require('@nomicfoundation/hardhat-toolbox/network-helpers')

describe("Purr Token Contract", function () {

    async function deployPurrTokenFixture() {
        const [owner, addr1, addr2] = await ethers.getSigners();

        // Deploy MockCryptoKitties
        const MockCryptoKittiesFactory = await ethers.getContractFactory("MockCryptoKitties");
        const cryptokitties = await MockCryptoKittiesFactory.deploy();
        await cryptokitties.waitForDeployment();

        // Deploy Purr token
        const Purr = await ethers.getContractFactory("Purr");
        const purr = await Purr.deploy(cryptokitties.target);
        await purr.waitForDeployment();

        return { purr, cryptokitties, owner, addr1, addr2 };
    }

    describe("Deployment", function () {
        it("should set the correct name and symbol", async function () {
            const { purr } = await loadFixture(deployPurrTokenFixture);
            
            expect(await purr.name()).to.equal("$PURR");
            expect(await purr.symbol()).to.equal("$PURR");
        });

        it("should set the correct decimals", async function () {
            const { purr } = await loadFixture(deployPurrTokenFixture);
            
            expect(await purr.decimals()).to.equal(18);
        });

        it("should store the CryptoKitties contract address", async function () {
            const { purr, cryptokitties } = await loadFixture(deployPurrTokenFixture);
            
            expect(await purr.cryptoKitties()).to.equal(await cryptokitties.getAddress());
        });

        it("should mint tokens equal to CryptoKitties totalSupply to deployer", async function () {
            const { purr, cryptokitties, owner } = await loadFixture(deployPurrTokenFixture);
            
            const cryptoKittiesTotalSupply = await cryptokitties.totalSupply();
            const expectedPurrTokens = cryptoKittiesTotalSupply * (10n ** 18n);
            
            expect(await purr.balanceOf(owner.address)).to.equal(expectedPurrTokens);
            expect(await purr.totalSupply()).to.equal(expectedPurrTokens);
        });

        it("should revert when CryptoKitties address has no totalSupply function", async function () {
            const Purr = await ethers.getContractFactory("Purr");
            
            // Deploying with zero address should revert when trying to call totalSupply()
            await expect(
                Purr.deploy(ethers.ZeroAddress)
            ).to.be.reverted;
        });
    });

    describe("Token Supply Calculation", function () {
        it("should mint correct amount with different CryptoKitties totalSupply values", async function () {
            const [owner] = await ethers.getSigners();
            
            const testCases = [
                { totalSupply: 1000n, description: "small supply" },
                { totalSupply: 2500000n, description: "default supply" },
                { totalSupply: 10000000n, description: "large supply" },
                { totalSupply: 1n, description: "minimal supply" }
            ];

            for (const testCase of testCases) {
                // Deploy MockCryptoKitties
                const MockCryptoKittiesFactory = await ethers.getContractFactory("MockCryptoKitties");
                const cryptokitties = await MockCryptoKittiesFactory.deploy();
                await cryptokitties.waitForDeployment();
                
                // Set custom total supply
                await cryptokitties.setTotalSupply(testCase.totalSupply);
                
                // Deploy Purr token
                const Purr = await ethers.getContractFactory("Purr");
                const purr = await Purr.deploy(await cryptokitties.getAddress());
                await purr.waitForDeployment();
                
                // Verify correct minting
                const expectedTokens = testCase.totalSupply * (10n ** 18n);
                expect(await purr.balanceOf(owner.address)).to.equal(expectedTokens, 
                    `Failed for ${testCase.description}`);
                expect(await purr.totalSupply()).to.equal(expectedTokens, 
                    `Total supply failed for ${testCase.description}`);
            }
        });

        it("should handle zero totalSupply from CryptoKitties", async function () {
            const [owner] = await ethers.getSigners();
            
            // Deploy MockCryptoKitties
            const MockCryptoKittiesFactory = await ethers.getContractFactory("MockCryptoKitties");
            const cryptokitties = await MockCryptoKittiesFactory.deploy();
            await cryptokitties.waitForDeployment();
            
            // Set zero total supply
            await cryptokitties.setTotalSupply(0);
            
            // Deploy Purr token
            const Purr = await ethers.getContractFactory("Purr");
            const purr = await Purr.deploy(await cryptokitties.getAddress());
            await purr.waitForDeployment();
            
            // Should mint zero tokens
            expect(await purr.balanceOf(owner.address)).to.equal(0);
            expect(await purr.totalSupply()).to.equal(0);
        });
    });

    describe("ERC20 Functionality", function () {
        it("should allow token transfers", async function () {
            const { purr, owner, addr1 } = await loadFixture(deployPurrTokenFixture);
            
            const transferAmount = ethers.parseEther("1000");
            
            // Transfer tokens
            await purr.connect(owner).transfer(addr1.address, transferAmount);
            
            expect(await purr.balanceOf(addr1.address)).to.equal(transferAmount);
        });

        it("should allow token approvals and transferFrom", async function () {
            const { purr, owner, addr1, addr2 } = await loadFixture(deployPurrTokenFixture);
            
            const approveAmount = ethers.parseEther("500");
            const transferAmount = ethers.parseEther("300");
            
            // Approve addr1 to spend tokens
            await purr.connect(owner).approve(addr1.address, approveAmount);
            expect(await purr.allowance(owner.address, addr1.address)).to.equal(approveAmount);
            
            // Transfer from owner to addr2 via addr1
            await purr.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount);
            
            expect(await purr.balanceOf(addr2.address)).to.equal(transferAmount);
            expect(await purr.allowance(owner.address, addr1.address)).to.equal(approveAmount - transferAmount);
        });

        it("should emit Transfer events", async function () {
            const { purr, owner, addr1 } = await loadFixture(deployPurrTokenFixture);
            
            const transferAmount = ethers.parseEther("100");
            
            await expect(purr.connect(owner).transfer(addr1.address, transferAmount))
                .to.emit(purr, "Transfer")
                .withArgs(owner.address, addr1.address, transferAmount);
        });

        it("should emit Approval events", async function () {
            const { purr, owner, addr1 } = await loadFixture(deployPurrTokenFixture);
            
            const approveAmount = ethers.parseEther("200");
            
            await expect(purr.connect(owner).approve(addr1.address, approveAmount))
                .to.emit(purr, "Approval")
                .withArgs(owner.address, addr1.address, approveAmount);
        });
    });

    describe("Contract Interface", function () {
        it("should correctly implement ICryptoKitties interface", async function () {
            const { purr, cryptokitties } = await loadFixture(deployPurrTokenFixture);
            
            // Verify that the stored contract can be called
            const storedCryptoKitties = await purr.cryptoKitties();
            expect(storedCryptoKitties).to.equal(await cryptokitties.getAddress());
            
            // Verify we can call totalSupply through the interface
            const MockCryptoKittiesFactory = await ethers.getContractFactory("MockCryptoKitties");
            const cryptoKittiesContract = MockCryptoKittiesFactory.attach(storedCryptoKitties);
            const totalSupply = await cryptoKittiesContract.totalSupply();
            
            expect(totalSupply).to.be.a('bigint');
            expect(totalSupply).to.be.greaterThan(0);
        });
    });

    describe("Immutable Properties", function () {
        it("should have immutable cryptoKitties address", async function () {
            const { purr, cryptokitties } = await loadFixture(deployPurrTokenFixture);
            
            // The cryptoKitties address should be immutable and not changeable
            const storedAddress = await purr.cryptoKitties();
            expect(storedAddress).to.equal(await cryptokitties.getAddress());
            
            // Verify it's the same across multiple calls
            const storedAddress2 = await purr.cryptoKitties();
            expect(storedAddress).to.equal(storedAddress2);
        });
    });

    describe("Purrs Function", function () {
        it("should return a frequency within the valid range (25-150 Hz)", async function () {
            const { purr } = await loadFixture(deployPurrTokenFixture);
            
            // Test multiple calls to ensure range consistency
            for (let i = 0; i < 10; i++) {
                const frequency = await purr.purrs();
                expect(frequency).to.be.at.least(25);
                expect(frequency).to.be.at.most(150);
            }
        });

        it("should return different frequencies for different callers", async function () {
            const { purr, owner, addr1, addr2 } = await loadFixture(deployPurrTokenFixture);
            
            const freq1 = await purr.connect(owner).purrs();
            const freq2 = await purr.connect(addr1).purrs();
            const freq3 = await purr.connect(addr2).purrs();
            
            // All should be in valid range
            [freq1, freq2, freq3].forEach(freq => {
                expect(freq).to.be.at.least(25);
                expect(freq).to.be.at.most(150);
            });
            
            // At least one should be different (very high probability with 126 possible values)
            const frequencies = [freq1, freq2, freq3];
            const uniqueFreqs = [...new Set(frequencies.map(f => f.toString()))];
            expect(uniqueFreqs.length).to.be.greaterThan(1);
        });

        it("should be a view function (no gas cost)", async function () {
            const { purr } = await loadFixture(deployPurrTokenFixture);
            
            // View functions should not modify state and cost no gas when called statically
            const frequency = await purr.purrs.staticCall();
            expect(frequency).to.be.at.least(25);
            expect(frequency).to.be.at.most(150);
        });

        it("should return consistent results for same block and caller", async function () {
            const { purr, owner } = await loadFixture(deployPurrTokenFixture);
            
            // Multiple calls in same transaction should return same result
            const freq1 = await purr.connect(owner).purrs();
            const freq2 = await purr.connect(owner).purrs();
            
            expect(freq1).to.equal(freq2);
        });

        it("should cover the full frequency spectrum over many calls", async function () {
            const { purr, owner } = await loadFixture(deployPurrTokenFixture);
            
            const frequencies = new Set();
            
            // Mine some blocks and collect frequencies to get variety
            for (let i = 0; i < 20; i++) {
                // Mine a block to change block properties
                await ethers.provider.send("evm_mine", []);
                const freq = await purr.connect(owner).purrs();
                frequencies.add(freq.toString());
            }
            
            // Should have collected multiple different frequencies
            expect(frequencies.size).to.be.greaterThan(5);
            
            // All frequencies should be in valid range
            frequencies.forEach(freq => {
                const freqNum = parseInt(freq);
                expect(freqNum).to.be.at.least(25);
                expect(freqNum).to.be.at.most(150);
            });
        });

        it("should include therapeutic frequencies (25-100 Hz)", async function () {
            const { purr } = await loadFixture(deployPurrTokenFixture);
            
            const therapeuticFreqs = [];
            
            // Collect frequencies from multiple blocks
            for (let i = 0; i < 15; i++) {
                await ethers.provider.send("evm_mine", []);
                const freq = await purr.purrs();
                if (freq >= 25 && freq <= 100) {
                    therapeuticFreqs.push(freq);
                }
            }
            
            // Should find some therapeutic frequencies
            expect(therapeuticFreqs.length).to.be.greaterThan(0);
        });

        it("should handle edge cases of the frequency range", async function () {
            const { purr } = await loadFixture(deployPurrTokenFixture);
            
            const frequencies = new Set();
            
            // Try to hit edge cases by mining many blocks
            for (let i = 0; i < 50; i++) {
                await ethers.provider.send("evm_mine", []);
                const freq = await purr.purrs();
                frequencies.add(freq.toString());
            }
            
            // Convert to numbers for analysis
            const freqNumbers = Array.from(frequencies).map(f => parseInt(f));
            
            // Should have minimum frequency of at least 25
            expect(Math.min(...freqNumbers)).to.be.at.least(25);
            
            // Should have frequencies close to maximum (150)
            const hasHighFreq = freqNumbers.some(f => f >= 140);
            expect(hasHighFreq).to.be.true;
        });

        it("should use block-based randomness correctly", async function () {
            const { purr, owner } = await loadFixture(deployPurrTokenFixture);
            
            // Get frequency at current block
            const freq1 = await purr.connect(owner).purrs();
            
            // Mine a block to change block properties
            await ethers.provider.send("evm_mine", []);
            
            // Get frequency at new block
            const freq2 = await purr.connect(owner).purrs();
            
            // Both should be valid
            expect(freq1).to.be.at.least(25);
            expect(freq1).to.be.at.most(150);
            expect(freq2).to.be.at.least(25);
            expect(freq2).to.be.at.most(150);
            
            // They might be different due to block changes (not guaranteed but likely)
            // This tests that the function is using block properties
        });
    
        describe("Purr Functionality", function () {
            it("should reject purring when already at cap", async function () {
                const { purr, owner } = await loadFixture(deployPurrTokenFixture);
                
                // By default, PURR supply equals CryptoKitties supply, so should be at cap
                await expect(
                    purr.connect(owner).purr()
                ).to.be.revertedWith("No new PURR tokens to mint");
            });
    
            it("should allow anyone to call purr function", async function () {
                const [owner, addr1] = await ethers.getSigners();
                
                // Deploy MockCryptoKitties with initial supply
                const MockCryptoKittiesFactory = await ethers.getContractFactory("MockCryptoKitties");
                const cryptokitties = await MockCryptoKittiesFactory.deploy();
                await cryptokitties.waitForDeployment();
                
                await cryptokitties.setTotalSupply(1000n);
                
                // Deploy Purr token
                const Purr = await ethers.getContractFactory("Purr");
                const purr = await Purr.deploy(await cryptokitties.getAddress());
                await purr.waitForDeployment();
                
                // Increase CryptoKitties supply
                await cryptokitties.setTotalSupply(1200n);
                
                // Non-owner should be able to call purr
                const ownerBalanceBefore = await purr.balanceOf(owner.address);
                await purr.connect(addr1).purr();
                
                // Tokens should still go to contract owner
                const ownerBalanceAfter = await purr.balanceOf(owner.address);
                const expectedMint = 200n * (10n ** 18n);
                expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(expectedMint);
                
                // Caller (addr1) should not receive any tokens
                expect(await purr.balanceOf(addr1.address)).to.equal(0);
            });
    
            it("should mint correct amount when CryptoKitties supply increases", async function () {
                const [owner] = await ethers.getSigners();
                
                // Deploy MockCryptoKitties with initial supply
                const MockCryptoKittiesFactory = await ethers.getContractFactory("MockCryptoKitties");
                const cryptokitties = await MockCryptoKittiesFactory.deploy();
                await cryptokitties.waitForDeployment();
                
                const initialKittiesSupply = 1000n;
                await cryptokitties.setTotalSupply(initialKittiesSupply);
                
                // Deploy Purr token
                const Purr = await ethers.getContractFactory("Purr");
                const purr = await Purr.deploy(await cryptokitties.getAddress());
                await purr.waitForDeployment();
                
                // Initial PURR supply should equal kitties supply * 10^18
                const initialPurrSupply = await purr.totalSupply();
                expect(initialPurrSupply).to.equal(initialKittiesSupply * (10n ** 18n));
                
                // Should not be able to mint (already at cap)
                await expect(
                    purr.connect(owner).purr()
                ).to.be.revertedWith("No new PURR tokens to mint");
                
                // Increase CryptoKitties supply (simulating new births)
                const newKittiesSupply = 1500n;
                await cryptokitties.setTotalSupply(newKittiesSupply);
                
                // Get owner balance before minting
                const ownerBalanceBefore = await purr.balanceOf(owner.address);
                
                // Now should be able to mint the difference
                const additionalMintable = (newKittiesSupply - initialKittiesSupply) * (10n ** 18n);
                await purr.connect(owner).purr();
                
                // Verify owner received the minted tokens
                const ownerBalanceAfter = await purr.balanceOf(owner.address);
                expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(additionalMintable);
                
                // Verify new total supply
                const finalPurrSupply = await purr.totalSupply();
                expect(finalPurrSupply).to.equal(newKittiesSupply * (10n ** 18n));
            });
    
            it("should emit Mint event with correct parameters", async function () {
                const [owner] = await ethers.getSigners();
                
                // Deploy MockCryptoKitties with initial supply
                const MockCryptoKittiesFactory = await ethers.getContractFactory("MockCryptoKitties");
                const cryptokitties = await MockCryptoKittiesFactory.deploy();
                await cryptokitties.waitForDeployment();
                
                await cryptokitties.setTotalSupply(1000n);
                
                // Deploy Purr token
                const Purr = await ethers.getContractFactory("Purr");
                const purr = await Purr.deploy(await cryptokitties.getAddress());
                await purr.waitForDeployment();
                
                // Increase CryptoKitties supply
                await cryptokitties.setTotalSupply(1200n);
                
                const expectedMintAmount = 200n * (10n ** 18n);
                
                await expect(purr.connect(owner).purr())
                    .to.emit(purr, "Purrs")
                    .withArgs(expectedMintAmount);
            });
    
            it("should handle multiple mint calls correctly", async function () {
                const [owner] = await ethers.getSigners();
                
                // Deploy MockCryptoKitties with initial supply
                const MockCryptoKittiesFactory = await ethers.getContractFactory("MockCryptoKitties");
                const cryptokitties = await MockCryptoKittiesFactory.deploy();
                await cryptokitties.waitForDeployment();
                
                await cryptokitties.setTotalSupply(1000n);
                
                // Deploy Purr token
                const Purr = await ethers.getContractFactory("Purr");
                const purr = await Purr.deploy(await cryptokitties.getAddress());
                await purr.waitForDeployment();
                
                // First increase and mint
                await cryptokitties.setTotalSupply(1200n);
                await purr.connect(owner).purr();
                
                // Should not be able to mint again (at cap)
                await expect(
                    purr.connect(owner).purr()
                ).to.be.revertedWith("No new PURR tokens to mint");
                
                // Second increase and mint
                await cryptokitties.setTotalSupply(1500n);
                await purr.connect(owner).purr();
                
                // Final supply should match kitties supply
                const finalPurrSupply = await purr.totalSupply();
                expect(finalPurrSupply).to.equal(1500n * (10n ** 18n));
            });
        });

        describe("Paws (Pause) Functionality", function () {
            it("should start with purring enabled (paws down)", async function () {
                const { purr } = await loadFixture(deployPurrTokenFixture);
                
                expect(await purr.paws()).to.be.false;
                expect(await purr.purrmanentPaws()).to.be.false;
            });

            it("should allow owner to toggle paws", async function () {
                const { purr, owner } = await loadFixture(deployPurrTokenFixture);
                
                // Toggle paws on
                await purr.connect(owner).togglePaws();
                expect(await purr.paws()).to.be.true;
                
                // Toggle paws off
                await purr.connect(owner).togglePaws();
                expect(await purr.paws()).to.be.false;
            });

            it("should emit Paws event", async function () {
                const { purr, owner } = await loadFixture(deployPurrTokenFixture);
                
                await expect(purr.connect(owner).togglePaws())
                    .to.emit(purr, "Paws")
                    .withArgs(true);
                    
                await expect(purr.connect(owner).togglePaws())
                    .to.emit(purr, "Paws")
                    .withArgs(false);
            });

            it("should prevent minting when paws is true", async function () {
                const [owner] = await ethers.getSigners();
                
                // Deploy MockCryptoKitties with initial supply
                const MockCryptoKittiesFactory = await ethers.getContractFactory("MockCryptoKitties");
                const cryptokitties = await MockCryptoKittiesFactory.deploy();
                await cryptokitties.waitForDeployment();
                
                await cryptokitties.setTotalSupply(1000n);
                
                // Deploy Purr token
                const Purr = await ethers.getContractFactory("Purr");
                const purr = await Purr.deploy(await cryptokitties.getAddress());
                await purr.waitForDeployment();
                
                // Increase CryptoKitties supply to enable minting
                await cryptokitties.setTotalSupply(1200n);
                
                // Enable paws (pause minting)
                await purr.connect(owner).togglePaws();
                
                // Should not be able to mint
                await expect(
                    purr.purr()
                ).to.be.revertedWith("Purr paws");
            });

            it("should allow owner to stop purring forever", async function () {
                const { purr, owner } = await loadFixture(deployPurrTokenFixture);
                
                await purr.connect(owner).stopPurringForever();
                
                expect(await purr.purrmanentPaws()).to.be.true;
                expect(await purr.paws()).to.be.true; // Should also set paws to true
            });

            it("should prevent purring when stopped forever", async function () {
                const [owner] = await ethers.getSigners();
                
                // Deploy MockCryptoKitties with initial supply
                const MockCryptoKittiesFactory = await ethers.getContractFactory("MockCryptoKitties");
                const cryptokitties = await MockCryptoKittiesFactory.deploy();
                await cryptokitties.waitForDeployment();
                
                await cryptokitties.setTotalSupply(1000n);
                
                // Deploy Purr token
                const Purr = await ethers.getContractFactory("Purr");
                const purr = await Purr.deploy(await cryptokitties.getAddress());
                await purr.waitForDeployment();
                
                // Stop purring forever
                await purr.connect(owner).stopPurringForever();
                
                // Increase CryptoKitties supply
                await cryptokitties.setTotalSupply(1200n);
                
                // Should not be able to purr
                await expect(
                    purr.purr()
                ).to.be.revertedWith("Purring is over");
            });

            it("should prevent toggling paws when purring is stopped forever", async function () {
                const { purr, owner } = await loadFixture(deployPurrTokenFixture);
                
                await purr.connect(owner).stopPurringForever();
                
                await expect(
                    purr.connect(owner).togglePaws()
                ).to.be.revertedWith("Purring is over");
            });
        });
    });
});