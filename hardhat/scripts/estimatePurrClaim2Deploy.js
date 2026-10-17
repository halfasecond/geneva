const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const dataDir = path.join(__dirname, "data");
    const root = JSON.parse(fs.readFileSync(path.join(dataDir, "gilded-root.json"), "utf8")).root;
    const grandmasters = JSON.parse(fs.readFileSync(path.join(dataDir, "grandmaster-addresses.json"), "utf8"));

    const Mock = await ethers.getContractFactory("MockCryptoKitties");
    const ck = await Mock.deploy();
    await ck.waitForDeployment();

    const Purr = await ethers.getContractFactory("Purr");
    const purr = await Purr.deploy(await ck.getAddress());
    await purr.waitForDeployment();

    const Claim = await ethers.getContractFactory("PurrClaim2");
    const tx = await Claim.getDeployTransaction(
        await purr.getAddress(),
        await ck.getAddress(),
        root,
        grandmasters
    );
    const estimated = await ethers.provider.estimateGas(tx);

    const deployed = await Claim.deploy(
        await purr.getAddress(),
        await ck.getAddress(),
        root,
        grandmasters
    );
    const receipt = await deployed.deploymentTransaction().wait();

    const bytecode = Claim.bytecode;
    console.log(JSON.stringify({
        grandmasters: grandmasters.length,
        estimatedGas: estimated.toString(),
        gasUsed: receipt.gasUsed.toString(),
        bytecodeBytes: (bytecode.length - 2) / 2,
        contractAddress: await deployed.getAddress(),
        grandmasterCount: (await deployed.grandmasterCount()).toString(),
    }, null, 2));
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
