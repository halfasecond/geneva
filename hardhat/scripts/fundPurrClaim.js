const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await ethers.getSigners();

    // Get the current network's chain ID
    const chainId = 31337 //network.config.chainId;
    
    // Construct the path to the deployment file for the current network
    const deploymentPath = path.join(__dirname, `../ignition/deployments/chain-${chainId}/deployed_addresses.json`);
    
    // Check if the deployment file exists
    if (!fs.existsSync(deploymentPath)) {
        throw new Error(`Deployment file not found for chain ID ${chainId}. Please make sure you've deployed the contracts to this network.`);
    }
    
    // Import addresses from the deployed_addresses.json file
    const deployedAddresses = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    
    const purrTokenAddress = deployedAddresses["PurrModule#Purr"];
    const purrClaimAddress = deployedAddresses["PurrModule#PurrClaim"];
    
    if (!purrTokenAddress || !purrClaimAddress) {
        throw new Error("Required contract addresses not found in deployment file.");
    }

    // Connect to the deployed PurrToken contract
    const PurrToken = await ethers.getContractAt("Purr", purrTokenAddress);

    // Amount to fund the PurrClaim contract (e.g., 250k PURR)
    const fundAmount = "50000000000000000000000";

    // Transfer tokens from deployer to the PurrClaim contract
    console.log(`Funding PurrClaim contract with ${fundAmount.toString()} $PURR...`);
    console.log(`Using PurrToken at ${purrTokenAddress}`);
    console.log(`Sending to PurrClaim at ${purrClaimAddress}`);
    const tx = await PurrToken.transfer(purrClaimAddress, fundAmount);
    await tx.wait();
    console.log(`PurrClaim contract funded! Transaction hash: ${tx.hash}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});