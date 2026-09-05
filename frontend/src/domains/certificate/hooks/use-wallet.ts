import * as React from 'react';
import { BrowserProvider, id as keccakId } from 'ethers';

import { CHAIN_ID, getRegistryContract } from '../util/certificate-registry';

const ISSUER_ROLE = keccakId('ISSUER_ROLE');

type WalletState = {
  account: string | null;
  chainId: number | null;
  isCorrectChain: boolean;
  hasIssuerRole: boolean;
  isConnecting: boolean;
  error: string | null;
};

const initialState: WalletState = {
  account: null,
  chainId: null,
  isCorrectChain: false,
  hasIssuerRole: false,
  isConnecting: false,
  error: null
};

export const useWallet = () => {
  const [state, setState] = React.useState<WalletState>(initialState);

  const refreshIssuerRole = React.useCallback(
    async (provider: BrowserProvider, account: string) => {
      try {
        const registry = getRegistryContract(provider);
        const hasRole = (await registry.hasRole(ISSUER_ROLE, account)) as boolean;
        setState((prev) => ({ ...prev, hasIssuerRole: hasRole }));
      } catch {
        setState((prev) => ({ ...prev, hasIssuerRole: false }));
      }
    },
    []
  );

  const connect = React.useCallback(async () => {
    const ethereum = window.ethereum;

    if (!ethereum) {
      setState((prev) => ({ ...prev, error: 'No wallet found. Please install MetaMask.' }));
      return;
    }

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      const provider = new BrowserProvider(ethereum);
      const accounts = (await provider.send('eth_requestAccounts', [])) as string[];
      const network = await provider.getNetwork();
      const account = accounts[0] ?? null;
      const chainId = Number(network.chainId);

      setState((prev) => ({
        ...prev,
        account,
        chainId,
        isCorrectChain: chainId === CHAIN_ID,
        isConnecting: false,
        error: null
      }));

      if (account) {
        await refreshIssuerRole(provider, account);
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Failed to connect wallet.'
      }));
    }
  }, [refreshIssuerRole]);

  React.useEffect(() => {
    const ethereum = window.ethereum;

    if (!ethereum) return;

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      const account = accounts[0] ?? null;

      setState((prev) => ({ ...prev, account, hasIssuerRole: false }));

      if (account) {
        void refreshIssuerRole(new BrowserProvider(ethereum), account);
      }
    };

    const handleChainChanged = (...args: unknown[]) => {
      const chainId = Number(args[0] as string);
      setState((prev) => ({ ...prev, chainId, isCorrectChain: chainId === CHAIN_ID }));
    };

    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);

    return () => {
      ethereum.removeListener('accountsChanged', handleAccountsChanged);
      ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [refreshIssuerRole]);

  return { ...state, connect };
};
