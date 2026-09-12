import * as React from 'react';
import { Alert, Typography } from '@mui/material';
import { toast } from 'react-toastify';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { SerializedError } from '@reduxjs/toolkit';
import { BrowserProvider } from 'ethers';

import { DialogModal } from '@/components/dialog-modal';
import { getErrorMsg } from '@/utils/helpers/get-error-message';
import { getRegistryContract } from '../util';
import { useWallet } from '../hooks';
import { useRevokeCertificateMutation } from '../api';

type RevokeCertificateProps = {
  certificateId: number;
  certId: string;
  closeModal: () => void;
  wallet: ReturnType<typeof useWallet>;
};

export const RevokeCertificate: React.FC<RevokeCertificateProps> = ({
  certificateId,
  certId,
  closeModal,
  wallet
}) => {
  const [revokeCertificate, { isLoading: isRevoking }] = useRevokeCertificateMutation();
  const [isRevokingOnChain, setIsRevokingOnChain] = React.useState(false);
  const { account, isCorrectChain, hasIssuerRole } = wallet;
  const canRevoke = Boolean(account) && isCorrectChain && hasIssuerRole;

  // Mirrors the issuance flow's ordering: the on-chain revoke is confirmed first, and only then
  // is the database row updated. If the wallet rejects the transaction, nothing is called and the
  // row simply stays 'issued' — no orphaned intermediate state.
  const onSave = async () => {
    if (!canRevoke) {
      toast.error(
        'Connect a wallet on the correct network with issuer access to revoke a certificate.'
      );
      return;
    }

    setIsRevokingOnChain(true);
    try {
      if (!window.ethereum) {
        throw new Error('No wallet found. Please install MetaMask.');
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const registry = getRegistryContract(signer);

      const tx = await registry.revokeCertificate(certId);
      const receipt = await tx.wait();
      if (!receipt) {
        throw new Error('Transaction did not confirm. Please try again.');
      }

      const result = await revokeCertificate(certificateId).unwrap();
      toast.info(result.message);
      closeModal();
    } catch (error) {
      toast.error(getErrorMsg(error as FetchBaseQueryError | SerializedError).message);
    } finally {
      setIsRevokingOnChain(false);
    }
  };

  return (
    <DialogModal
      isSaving={isRevoking || isRevokingOnChain}
      actionFooterCancelText='No'
      actionFooterSaveText='Yes'
      isOpen={true}
      closeModal={closeModal}
      handleSave={onSave}
      titleText='Revoke Certificate'
    >
      <Typography variant='body1'>
        Are you sure you want to revoke this certificate? This requires a wallet transaction and
        cannot be undone.
      </Typography>
      {!canRevoke && (
        <Alert severity='warning' sx={{ mt: 2 }}>
          Connect a wallet on the correct network with issuer access before revoking.
        </Alert>
      )}
    </DialogModal>
  );
};
