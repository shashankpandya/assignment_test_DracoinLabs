// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title CertificateRegistry
/// @notice Minimal on-chain registry for student achievement certificates.
///         Records are keyed by an off-chain generated `certId` and are
///         non-transferable by construction: this is deliberately not an
///         ERC-721, because a certificate belongs to the student it was
///         issued to and must never change hands.
/// @dev    `metadataHash` is a **sha256** digest of the exact bytes pinned to
///         IPFS, not the usual EVM keccak256. The contract only ever stores an
///         opaque bytes32, so the choice of digest is a caller-side concern; it
///         is sha256 so the issuing backend can hash with Node's built-in
///         `crypto` module and add no dependency. The browser recomputes it
///         with `ethers.sha256` at verification time.
contract CertificateRegistry is AccessControl {
    struct Certificate {
        address recipient;
        address issuer;
        string ipfsCid;
        bytes32 metadataHash;
        uint64 issuedAt;
        bool revoked;
    }

    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    mapping(bytes32 => Certificate) private _certificates;

    error CertificateAlreadyExists(bytes32 certId);
    error CertificateNotFound(bytes32 certId);
    error CertificateAlreadyRevoked(bytes32 certId);
    error InvalidRecipient();
    error EmptyCid();

    event CertificateIssued(
        bytes32 indexed certId,
        address indexed recipient,
        address indexed issuer,
        string ipfsCid,
        bytes32 metadataHash
    );

    event CertificateRevoked(bytes32 indexed certId, address indexed revokedBy);

    /// @notice Grants both roles to the deployer.
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ISSUER_ROLE, msg.sender);
    }

    /// @notice Anchors a new certificate on chain.
    /// @dev Reverting on a duplicate `certId` is load-bearing: it makes a
    ///      retried issuance idempotent instead of creating a second record.
    function issueCertificate(
        bytes32 certId,
        address recipient,
        string calldata ipfsCid,
        bytes32 metadataHash
    ) external onlyRole(ISSUER_ROLE) {
        if (_certificates[certId].issuedAt != 0) {
            revert CertificateAlreadyExists(certId);
        }
        if (recipient == address(0)) {
            revert InvalidRecipient();
        }
        if (bytes(ipfsCid).length == 0) {
            revert EmptyCid();
        }

        _certificates[certId] = Certificate({
            recipient: recipient,
            issuer: msg.sender,
            ipfsCid: ipfsCid,
            metadataHash: metadataHash,
            issuedAt: uint64(block.timestamp),
            revoked: false
        });

        emit CertificateIssued(certId, recipient, msg.sender, ipfsCid, metadataHash);
    }

    /// @notice Marks an existing certificate as revoked. The record itself is
    ///         kept, so a revoked certificate stays inspectable forever.
    function revokeCertificate(bytes32 certId) external onlyRole(ISSUER_ROLE) {
        Certificate storage certificate = _certificates[certId];

        if (certificate.issuedAt == 0) {
            revert CertificateNotFound(certId);
        }
        if (certificate.revoked) {
            revert CertificateAlreadyRevoked(certId);
        }

        certificate.revoked = true;

        emit CertificateRevoked(certId, msg.sender);
    }

    /// @notice Read used by the verification screen.
    /// @return exists whether a record was ever anchored for `certId`
    /// @return valid  `exists && !revoked`
    /// @return certificate the stored record (zero-valued when `exists` is false)
    function verifyCertificate(bytes32 certId)
        external
        view
        returns (bool exists, bool valid, Certificate memory certificate)
    {
        certificate = _certificates[certId];
        exists = certificate.issuedAt != 0;
        valid = exists && !certificate.revoked;
    }
}
