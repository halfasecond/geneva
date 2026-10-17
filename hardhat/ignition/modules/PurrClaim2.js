const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules")
const fs = require("fs")
const path = require("path")

module.exports = buildModule("PurrClaim2Module", (m) => {
    const purrToken = m.getParameter(
        "purrToken",
        "0x74E9C7f23f11B72b8A7340E11Fe72D93D91fAe8e"
    )
    const cryptoKitties = m.getParameter(
        "cryptoKitties",
        "0x06012c8cf97BEaD5deAe237070F9587f8E7A266d"
    )

    const dataDir = path.join(__dirname, "../../scripts/data")
    const rootPath = path.join(dataDir, "gilded-root.json")
    const gmPath = path.join(dataDir, "grandmaster-addresses.json")

    let gildedRoot = "0x0000000000000000000000000000000000000000000000000000000000000000"
    let grandmasters = []
    if (fs.existsSync(rootPath)) {
        gildedRoot = JSON.parse(fs.readFileSync(rootPath, "utf8")).root
    }
    if (fs.existsSync(gmPath)) {
        grandmasters = JSON.parse(fs.readFileSync(gmPath, "utf8"))
    }

    const claim = m.contract("PurrClaim2", [
        purrToken,
        cryptoKitties,
        gildedRoot,
        grandmasters,
    ])

    return { claim }
})
