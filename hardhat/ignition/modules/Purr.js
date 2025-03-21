const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules")

module.exports = buildModule("PurrModule", (m) => {
    // Deploy the PurrToken
    const purrDeployment = m.contract("Purr")
    // Deploy the PurrClaim contract with PurrToken and CryptoKitties contract addresses
    // const cryptoKittiesAddress = "0x06012c8cf97BEaD5deAe237070F9587f8E7A266d"
    const cryptoKittiesAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    const purrClaimDeployment = m.contract("PurrClaim", [purrDeployment, cryptoKittiesAddress])
    return {
        purrDeployment,
        purrClaimDeployment,
    }
})