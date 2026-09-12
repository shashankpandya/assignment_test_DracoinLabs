import { z } from 'zod';
import { CertificateFormSchema } from './certificate-schema';

export type CertificateForm = z.infer<typeof CertificateFormSchema>;

export type CertificateStatus = 'pending' | 'issued' | 'revoked';

export type CertificateFormWithId = {
  id: number;
  studentId: number;
  studentName: string;
  title: string;
  description: string | null;
  issuedDate: string;
  certId: string;
  ipfsCid: string;
  isPinned: boolean;
  metadataHash: string;
  recipientAddress: string;
  issuerAddress?: string | null;
  contractAddress: string | null;
  chainId: number | null;
  txHash: string | null;
  blockNumber?: number | null;
  status: CertificateStatus;
  revokedDate?: string | null;
};

export type CertificateData = {
  certificates: CertificateFormWithId[];
};

export type IssuableStudent = {
  id: number;
  name: string;
  email: string;
};

export type IssuableStudentsData = {
  students: IssuableStudent[];
};

export type AddCertificateResponse = {
  id: number;
  certId: string;
  ipfsCid: string;
  isPinned: boolean;
  metadataHash: string;
  recipientAddress: string;
};

export type AnchorCertificatePayload = {
  id: number;
  issuerAddress: string;
  chainId: number;
  contractAddress: string;
  txHash: string;
  blockNumber: number;
};

// `metadataJson` is the exact JSON text stored server-side as TEXT, not JSONB (see CLAUDE.md
// Session 5 — JSONB silently re-serializes and reorders keys, which breaks the byte-exact hash
// comparison at verification time). Always hash this string exactly as received, never
// `JSON.parse` it and re-stringify.
export type CertificateMetadataResponse = {
  ipfsCid: string;
  isPinned: boolean;
  metadataJson: string;
};
