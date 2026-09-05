import * as React from 'react';
import {
  Alert,
  Box,
  Grid2,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  TextField,
  Typography
} from '@mui/material';
import { Cancel, CheckCircle, FactCheck } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { useSearchParams } from 'react-router-dom';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { SerializedError } from '@reduxjs/toolkit';
import { JsonRpcProvider, sha256 } from 'ethers';

import { PageContentHeader } from '@/components/page-content-header';
import { getErrorMsg } from '@/utils/helpers/get-error-message';
import { getRegistryContract, IPFS_GATEWAY_URL, RPC_URL } from '../util';
import { useLazyGetCertificateMetadataQuery } from '../api';

const CERT_ID_PATTERN = /^0x[0-9a-fA-F]{64}$/;

type VerificationResult = {
  exists: boolean;
  valid: boolean;
  recipient: string;
  issuer: string;
  ipfsCid: string;
  issuedAt: number;
  metadataHashMatches: boolean;
};

export const VerifyCertificatePage = () => {
  const [searchParams] = useSearchParams();
  const [certId, setCertId] = React.useState(searchParams.get('certId') || '');
  const [formatError, setFormatError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<VerificationResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [getCertificateMetadata] = useLazyGetCertificateMetadataQuery();

  const verify = React.useCallback(
    async (id: string) => {
      if (!CERT_ID_PATTERN.test(id)) {
        setFormatError('Invalid certificate ID format.');
        setResult(null);
        return;
      }

      setFormatError(null);
      setError(null);
      setResult(null);
      setIsVerifying(true);

      try {
        const provider = new JsonRpcProvider(RPC_URL);
        const registry = getRegistryContract(provider);
        const [exists, valid, certificate] = await registry.verifyCertificate(id);

        if (!exists) {
          setResult({
            exists: false,
            valid: false,
            recipient: '',
            issuer: '',
            ipfsCid: '',
            issuedAt: 0,
            metadataHashMatches: false
          });
          return;
        }

        const ipfsCid = certificate.ipfsCid as string;

        // The `local://` branch is decided here, before any network call — never a
        // try-gateway-then-fallback heuristic that could send a stub CID to a real gateway URL.
        let bytes: Uint8Array;
        if (ipfsCid.startsWith('local://')) {
          const metadata = await getCertificateMetadata(ipfsCid).unwrap();
          // `metadataJson` is the exact bytes the backend hashed (stored as TEXT, see
          // CLAUDE.md Session 5) — hashed as-is, never JSON.parse'd and re-stringified.
          bytes = new TextEncoder().encode(metadata.metadataJson);
        } else {
          const response = await fetch(`${IPFS_GATEWAY_URL}/${ipfsCid}`);
          if (!response.ok) {
            throw new Error('Unable to fetch certificate metadata from IPFS.');
          }
          // Hash the exact bytes the gateway serves, never a parsed-then-re-encoded object.
          bytes = new Uint8Array(await response.arrayBuffer());
        }

        const computedHash = sha256(bytes);
        const metadataHashMatches = computedHash === certificate.metadataHash;

        setResult({
          exists,
          valid,
          recipient: certificate.recipient as string,
          issuer: certificate.issuer as string,
          ipfsCid,
          issuedAt: Number(certificate.issuedAt),
          metadataHashMatches
        });
      } catch (err) {
        setError(getErrorMsg(err as FetchBaseQueryError | SerializedError).message);
      } finally {
        setIsVerifying(false);
      }
    },
    [getCertificateMetadata]
  );

  React.useEffect(() => {
    const initial = searchParams.get('certId');
    if (initial) {
      verify(initial);
    }
    // Only ever runs once, off the initial query string value — re-runs are user-triggered.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isFullyValid = Boolean(result?.exists && result.valid && result.metadataHashMatches);

  return (
    <>
      <PageContentHeader icon={<FactCheck sx={{ mr: 1 }} />} heading='Verify Certificate' />
      <Grid2 container columnSpacing={5} rowSpacing={2}>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <Box component={Paper} sx={{ p: 2 }}>
            <TextField
              label='Certificate ID'
              placeholder='0x...'
              fullWidth
              size='small'
              slotProps={{ inputLabel: { shrink: true } }}
              value={certId}
              onChange={(event) => setCertId(event.target.value.trim())}
              error={!!formatError}
              helperText={formatError}
            />
            <Box textAlign='center'>
              <LoadingButton
                variant='contained'
                size='small'
                sx={{ mt: 3 }}
                loading={isVerifying}
                onClick={() => verify(certId)}
              >
                Verify
              </LoadingButton>
            </Box>
          </Box>

          {error && (
            <Alert severity='error' sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {result && (
            <Box component={Paper} sx={{ p: 2, mt: 2 }}>
              <Alert severity={isFullyValid ? 'success' : 'error'} sx={{ mb: 2 }}>
                {isFullyValid
                  ? 'This certificate is valid.'
                  : 'This certificate did not pass verification.'}
              </Alert>

              <List dense>
                <ListItem>
                  <ListItemIcon>
                    {result.exists ? <CheckCircle color='success' /> : <Cancel color='error' />}
                  </ListItemIcon>
                  <ListItemText primary='On-chain record exists' />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    {result.valid ? <CheckCircle color='success' /> : <Cancel color='error' />}
                  </ListItemIcon>
                  <ListItemText primary='Not revoked' />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    {result.metadataHashMatches ? (
                      <CheckCircle color='success' />
                    ) : (
                      <Cancel color='error' />
                    )}
                  </ListItemIcon>
                  <ListItemText primary='Metadata hash matches on-chain record' />
                </ListItem>
              </List>

              {result.exists && (
                <>
                  <Typography variant='body2'>Recipient: {result.recipient}</Typography>
                  <Typography variant='body2'>Issuer: {result.issuer}</Typography>
                  <Typography variant='body2'>
                    Issued at:{' '}
                    {result.issuedAt
                      ? new Date(result.issuedAt * 1000).toLocaleString()
                      : 'Unknown'}
                  </Typography>
                </>
              )}
            </Box>
          )}
        </Grid2>
      </Grid2>
    </>
  );
};
