import { Contract, ContractRunner, isAddress } from 'ethers';

export const CERTIFICATE_REGISTRY_ABI = [
  'function ISSUER_ROLE() view returns (bytes32)',
  'function hasRole(bytes32 role, address account) view returns (bool)',
  'function issueCertificate(bytes32 certId, address recipient, string ipfsCid, bytes32 metadataHash)',
  'function revokeCertificate(bytes32 certId)',
  'function verifyCertificate(bytes32 certId) view returns (bool exists, bool valid, tuple(address recipient, address issuer, string ipfsCid, bytes32 metadataHash, uint64 issuedAt, bool revoked) certificate)',
  'event CertificateIssued(bytes32 indexed certId, address indexed recipient, address indexed issuer, string ipfsCid, bytes32 metadataHash)',
  'event CertificateRevoked(bytes32 indexed certId, address indexed revokedBy)',
  'error CertificateAlreadyExists(bytes32 certId)',
  'error CertificateNotFound(bytes32 certId)',
  'error CertificateAlreadyRevoked(bytes32 certId)',
  'error InvalidRecipient()',
  'error EmptyCid()'
] as const;

export const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID);
export const RPC_URL = import.meta.env.VITE_RPC_URL as string;
export const IPFS_GATEWAY_URL = import.meta.env.VITE_IPFS_GATEWAY_URL as string;
export const CERTIFICATE_CONTRACT_ADDRESS = import.meta.env
  .VITE_CERTIFICATE_CONTRACT_ADDRESS as string;

export const getRegistryContract = (runner: ContractRunner) => {
  if (!isAddress(CERTIFICATE_CONTRACT_ADDRESS)) {
    throw new Error(
      'Certificate contract is not configured — set VITE_CERTIFICATE_CONTRACT_ADDRESS'
    );
  }

  return new Contract(CERTIFICATE_CONTRACT_ADDRESS, CERTIFICATE_REGISTRY_ABI, runner);
};
