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
    
    const barcodeAddress = deployedAddresses["BarcodeModule#Barcode"];
    
    if (!barcodeAddress) {
        throw new Error("Required contract addresses not found in deployment file.");
    }

    // Connect to the deployed PurrToken contract
    const Barcode = await ethers.getContractAt("Barcode", barcodeAddress);
    // Transfer tokens from deployer to the PurrClaim contract
    console.log(`Using Barcode ERC721 at ${barcodeAddress}`);
    const tx = await Barcode.mint(1);
    await tx.wait();
    console.log(`Barcode minted! Transaction hash: ${tx.hash}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});