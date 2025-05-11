const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules")

module.exports = buildModule("CryptoKitties", (m) => {
    const ckDeployment = m.contract("CryptoKitties")
    return {
        ckDeployment,
    }
})