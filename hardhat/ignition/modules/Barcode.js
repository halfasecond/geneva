const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules")

module.exports = buildModule("BarcodeModule", (m) => {
    
    // Deploy Barcode
    const barcodeDeployment = m.contract("Barcode", [])
    
    // Deploy the PurrClaim contract with PurrToken and CryptoKitties contract addresses
    // const purrClaimDeployment = m.contract("PurrClaim", [purrDeployment, cryptoKittiesAddress])
    
    return {
        barcodeDeployment,
    }
})