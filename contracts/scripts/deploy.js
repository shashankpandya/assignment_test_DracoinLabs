const { ethers, network } = require("hardhat");

/**
 * Deploys CertificateRegistry and prints the address to paste into
 * frontend/.env as VITE_CERTIFICATE_CONTRACT_ADDRESS.
 *
 * Restarting `npx hardhat node` wipes the chain, so this script must be re-run
 * and that env var updated every time the node is restarted — previously
 * anchored certificates do not survive a fresh node.
 */
async function main() {
    const [deployer] = await ethers.getSigners();
    const { chainId } = await ethers.provider.getNetwork();

    const registry = await ethers.deployContract("CertificateRegistry");
    await registry.waitForDeployment();

    const address = await registry.getAddress();
    const issuerRole = await registry.ISSUER_ROLE();

    console.log(`Network:  ${network.name} (chainId ${chainId})`);
    console.log(`Deployer: ${deployer.address}`);
    console.log(`CertificateRegistry deployed to: ${address}`);
    console.log(`hasRole(ISSUER_ROLE, deployer):  ${await registry.hasRole(issuerRole, deployer.address)}`);
    console.log(`hasRole(DEFAULT_ADMIN_ROLE, deployer): ${await registry.hasRole(await registry.DEFAULT_ADMIN_ROLE(), deployer.address)}`);
    console.log("");
    console.log("Set this in frontend/.env:");
    console.log(`VITE_CERTIFICATE_CONTRACT_ADDRESS=${address}`);
    console.log("");
    console.log("The MetaMask account used to issue/revoke must hold ISSUER_ROLE —");
    console.log("import the deployer account above, or grant the role to another address.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
