const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();

    // Replace these with your deployed contract addresses
    const purrTokenAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
    const purrClaimAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"

    // Connect to the deployed PurrToken contract
    const PurrToken = await ethers.getContractAt("Purr", purrTokenAddress);

    // Amount to fund the PurrClaim contract (e.g., 1.275 million PURR)
    const fundAmount = "1275000000000000000000000";

    // Transfer tokens from deployer to the PurrClaim contract
    console.log(`Funding PurrClaim contract with ${fundAmount.toString()} $PURR...`);
    const tx = await PurrToken.transfer(purrClaimAddress, fundAmount);
    await tx.wait();
    console.log(`PurrClaim contract funded! Transaction hash: ${tx.hash}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
