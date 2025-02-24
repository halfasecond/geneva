import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
// @ts-ignore - Web3 types will be handled through any
import Web3 from 'web3';
import axios from 'axios';
import Cookies from 'js-cookie';
import {
  ExtendedProvider,
  ProviderEvent,
  RpcMethod,
  ProviderRpcError,
  isEIP1193Provider
} from '../types/eip1193';

const { VITE_APP_ENDPOINT, VITE_APP_CHAIN_ID, VITE_APP_TOKEN_NAME } = import.meta.env;

interface Web3ContextState {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  chainId: string | null;
  token: string | null;
  tokenId: number | null;
  error: Error | null;
  web3: any | null;
  provider: ExtendedProvider | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const Web3Context = createContext<Web3ContextState | null>(null);

interface Web3ProviderProps {
  children: ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const [web3, setWeb3] = useState<any | null>(null);
  const [provider, setProvider] = useState<ExtendedProvider | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(Cookies.get(VITE_APP_TOKEN_NAME) || null);
  const [tokenId, setTokenId] = useState<number | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Initialize provider
  const initializeProvider = (): ExtendedProvider | null => {
    if (typeof window !== 'undefined' && window.ethereum) {
      if (!isEIP1193Provider(window.ethereum)) {
        throw new Error('Provider does not implement EIP-1193 interface');
      }
      return window.ethereum;
    }
    return null;
  };

  // Initialize Web3 instance
  const initializeWeb3 = (provider: ExtendedProvider) => {
    const web3Instance = new Web3(provider as any);
    setWeb3(web3Instance);
    return web3Instance;
  };

  // Check if the wallet is on the correct network
  const checkNetwork = async (provider: ExtendedProvider) => {
    const chainId = await provider.request({ method: RpcMethod.ChainId });
    if (chainId !== VITE_APP_CHAIN_ID) {
      throw new Error(`Please switch to the correct network (Chain ID: ${VITE_APP_CHAIN_ID})`);
    }
    return chainId as string;
  };

  // Restore connection on page load
  useEffect(() => {
    const restoreConnection = async () => {
      try {
        // Only attempt to restore if we have a token
        if (!token) return;

        const provider = initializeProvider();
        if (!provider) return;

        // Check if wallet is unlocked and we have access
        const accounts = await provider.request({ method: RpcMethod.Accounts }) as string[];
        if (!accounts?.length) return;

        const chainId = await provider.request({ method: RpcMethod.ChainId });
        if (chainId !== VITE_APP_CHAIN_ID) return;

        // Initialize everything
        setProvider(provider);
        const web3Instance = initializeWeb3(provider);
        setAddress(accounts[0].toLowerCase());
        setChainId(chainId as string);
        setIsConnected(true);

        // Validate token
        const { data } = await axios.post(`${VITE_APP_ENDPOINT}chained-horse/auth/check-token`, { token });
        if (data.valid) {
          setTokenId(data.tokenId);
        } else {
          await disconnect();
        }
      } catch (err) {
        console.error('Failed to restore connection:', err);
        await disconnect();
      }
    };

    restoreConnection();
  }, []); // Run once on mount

  // Handle wallet events
  useEffect(() => {
    if (!provider) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        await disconnect();
      } else {
        setAddress(accounts[0].toLowerCase());
      }
    };

    const handleChainChanged = (chainId: string) => {
      setChainId(chainId);
      if (chainId !== VITE_APP_CHAIN_ID) {
        disconnect();
      }
    };

    const handleDisconnect = (error: ProviderRpcError) => {
      console.error('Wallet disconnected:', error);
      disconnect();
    };

    provider.on(ProviderEvent.AccountsChanged, handleAccountsChanged);
    provider.on(ProviderEvent.ChainChanged, handleChainChanged);
    provider.on(ProviderEvent.Disconnect, handleDisconnect);

    return () => {
      provider.off(ProviderEvent.AccountsChanged, handleAccountsChanged);
      provider.off(ProviderEvent.ChainChanged, handleChainChanged);
      provider.off(ProviderEvent.Disconnect, handleDisconnect);
    };
  }, [provider]);

  const connect = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      // Initialize provider
      const provider = initializeProvider();
      if (!provider) {
        throw new Error('Please install a Web3 wallet (MetaMask, Coinbase Wallet, etc.)');
      }
      setProvider(provider);

      // Initialize Web3
      const web3Instance = initializeWeb3(provider);

      // Check network
      const currentChainId = await checkNetwork(provider);
      setChainId(currentChainId);

      // Request accounts
      const accounts = await provider.request({ method: RpcMethod.RequestAccounts }) as string[];
      if (!accounts?.length) {
        throw new Error('No accounts found');
      }

      const userAddress = accounts[0].toLowerCase();
      setAddress(userAddress);

      // Sign message
      const message = 'Sign this message to authenticate';
      const signature = await web3Instance.eth.personal.sign(message, userAddress, '');

      // Authenticate
      const { data } = await axios.post(`${VITE_APP_ENDPOINT}chained-horse/auth`, {
        address: userAddress,
        signature,
        message
      });

      setToken(data.token);
      setTokenId(data.tokenId);
      setIsConnected(true);
      Cookies.set(VITE_APP_TOKEN_NAME, data.token);

    } catch (err) {
      console.error('Connection error:', err);
      setError(err instanceof Error ? err : new Error('Failed to connect'));
      await disconnect();
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      if (token) {
        await axios.post(`${VITE_APP_ENDPOINT}chained-horse/auth/logout`, { token });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsConnected(false);
      setAddress(null);
      setToken(null);
      setTokenId(null);
      setWeb3(null);
      setProvider(null);
      Cookies.remove(VITE_APP_TOKEN_NAME);
    }
  };

  return (
    <Web3Context.Provider
      value={{
        isConnected,
        isConnecting,
        address,
        chainId,
        token,
        tokenId,
        error,
        web3,
        provider,
        connect,
        disconnect
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}

export default Web3Context;