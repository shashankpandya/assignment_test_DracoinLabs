const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

const IPFS_CID = "QmT78zSuBmuS4z925WZfrqQ1qHaJ56DQaTfyMUF7F8ff5o";
const METADATA_HASH = ethers.sha256(ethers.toUtf8Bytes('{"name":"Test Certificate"}'));

describe("CertificateRegistry", function () {
    async function deployRegistryFixture() {
        const [deployer, student, outsider] = await ethers.getSigners();
        const registry = await ethers.deployContract("CertificateRegistry");
        await registry.waitForDeployment();

        const certId = ethers.id("certificate-1");

        return { registry, deployer, student, outsider, certId };
    }

    describe("deployment", function () {
        it("grants DEFAULT_ADMIN_ROLE and ISSUER_ROLE to the deployer", async function () {
            const { registry, deployer } = await loadFixture(deployRegistryFixture);

            expect(await registry.hasRole(await registry.DEFAULT_ADMIN_ROLE(), deployer.address)).to.equal(true);
            expect(await registry.hasRole(await registry.ISSUER_ROLE(), deployer.address)).to.equal(true);
        });
    });

    describe("issueCertificate", function () {
        it("stores the record and emits CertificateIssued", async function () {
            const { registry, deployer, student, certId } = await loadFixture(deployRegistryFixture);

            await expect(registry.issueCertificate(certId, student.address, IPFS_CID, METADATA_HASH))
                .to.emit(registry, "CertificateIssued")
                .withArgs(certId, student.address, deployer.address, IPFS_CID, METADATA_HASH);

            const [exists, valid, certificate] = await registry.verifyCertificate(certId);

            expect(exists).to.equal(true);
            expect(valid).to.equal(true);
            expect(certificate.recipient).to.equal(student.address);
            expect(certificate.issuer).to.equal(deployer.address);
            expect(certificate.ipfsCid).to.equal(IPFS_CID);
            expect(certificate.metadataHash).to.equal(METADATA_HASH);
            expect(certificate.revoked).to.equal(false);
            expect(certificate.issuedAt).to.be.greaterThan(0n);
        });

        it("reverts with CertificateAlreadyExists on a duplicate certId", async function () {
            const { registry, student, certId } = await loadFixture(deployRegistryFixture);

            await registry.issueCertificate(certId, student.address, IPFS_CID, METADATA_HASH);

            await expect(registry.issueCertificate(certId, student.address, IPFS_CID, METADATA_HASH))
                .to.be.revertedWithCustomError(registry, "CertificateAlreadyExists")
                .withArgs(certId);
        });

        it("reverts for a caller without ISSUER_ROLE", async function () {
            const { registry, student, outsider, certId } = await loadFixture(deployRegistryFixture);

            await expect(
                registry.connect(outsider).issueCertificate(certId, student.address, IPFS_CID, METADATA_HASH)
            )
                .to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount")
                .withArgs(outsider.address, await registry.ISSUER_ROLE());
        });

        it("reverts with InvalidRecipient on the zero address", async function () {
            const { registry, certId } = await loadFixture(deployRegistryFixture);

            await expect(
                registry.issueCertificate(certId, ethers.ZeroAddress, IPFS_CID, METADATA_HASH)
            ).to.be.revertedWithCustomError(registry, "InvalidRecipient");
        });

        it("reverts with EmptyCid on an empty ipfsCid", async function () {
            const { registry, student, certId } = await loadFixture(deployRegistryFixture);

            await expect(
                registry.issueCertificate(certId, student.address, "", METADATA_HASH)
            ).to.be.revertedWithCustomError(registry, "EmptyCid");
        });
    });

    describe("revokeCertificate", function () {
        it("marks the certificate revoked, keeps the record, and emits CertificateRevoked", async function () {
            const { registry, deployer, student, certId } = await loadFixture(deployRegistryFixture);

            await registry.issueCertificate(certId, student.address, IPFS_CID, METADATA_HASH);

            await expect(registry.revokeCertificate(certId))
                .to.emit(registry, "CertificateRevoked")
                .withArgs(certId, deployer.address);

            const [exists, valid, certificate] = await registry.verifyCertificate(certId);

            expect(exists).to.equal(true);
            expect(valid).to.equal(false);
            expect(certificate.revoked).to.equal(true);
            expect(certificate.ipfsCid).to.equal(IPFS_CID);
        });

        it("reverts with CertificateAlreadyRevoked on a second revoke", async function () {
            const { registry, student, certId } = await loadFixture(deployRegistryFixture);

            await registry.issueCertificate(certId, student.address, IPFS_CID, METADATA_HASH);
            await registry.revokeCertificate(certId);

            await expect(registry.revokeCertificate(certId))
                .to.be.revertedWithCustomError(registry, "CertificateAlreadyRevoked")
                .withArgs(certId);
        });

        it("reverts with CertificateNotFound for an unknown certId", async function () {
            const { registry, certId } = await loadFixture(deployRegistryFixture);

            await expect(registry.revokeCertificate(certId))
                .to.be.revertedWithCustomError(registry, "CertificateNotFound")
                .withArgs(certId);
        });

        it("reverts for a caller without ISSUER_ROLE", async function () {
            const { registry, student, outsider, certId } = await loadFixture(deployRegistryFixture);

            await registry.issueCertificate(certId, student.address, IPFS_CID, METADATA_HASH);

            await expect(registry.connect(outsider).revokeCertificate(certId))
                .to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount")
                .withArgs(outsider.address, await registry.ISSUER_ROLE());
        });
    });

    describe("verifyCertificate", function () {
        it("reports exists == false for an unknown certId", async function () {
            const { registry } = await loadFixture(deployRegistryFixture);

            const [exists, valid, certificate] = await registry.verifyCertificate(ethers.id("never-issued"));

            expect(exists).to.equal(false);
            expect(valid).to.equal(false);
            expect(certificate.recipient).to.equal(ethers.ZeroAddress);
            expect(certificate.issuedAt).to.equal(0n);
        });
    });
});
