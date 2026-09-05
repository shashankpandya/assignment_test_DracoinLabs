import * as React from 'react';
import { AccountBalanceWallet } from '@mui/icons-material';
import { Alert, Box, Paper, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';

import { CHAIN_ID } from '../util';
import { useWallet } from '../hooks';

type WalletConnectProps = {
  wallet: ReturnType<typeof useWallet>;
};

const truncateAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

export const WalletConnect: React.FC<WalletConnectProps> = ({ wallet }) => {
  const { account, chainId, isCorrectChain, hasIssuerRole, isConnecting, error, connect } = wallet;

  return (
    <Box component={Paper} sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <LoadingButton
          variant='contained'
          size='small'
          startIcon={<AccountBalanceWallet />}
          loading={isConnecting}
          onClick={connect}
        >
          {account ? truncateAddress(account) : 'Connect Wallet'}
        </LoadingButton>
        {account && (
          <Typography variant='body2' color='text.secondary'>
            Chain ID: {chainId}
          </Typography>
        )}
      </Box>

      {error && (
        <Alert severity='error' sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      {account && !isCorrectChain && (
        <Alert severity='warning' sx={{ mt: 2 }}>
          Wrong network. Switch your wallet to chain ID {CHAIN_ID} to issue or revoke certificates.
        </Alert>
      )}
      {account && isCorrectChain && !hasIssuerRole && (
        <Alert severity='warning' sx={{ mt: 2 }}>
          This account does not hold the issuer role on the certificate contract. Connect a
          different account to issue or revoke certificates.
        </Alert>
      )}
    </Box>
  );
};
