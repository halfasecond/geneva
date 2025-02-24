import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
// @ts-ignore - Web3 types are included in the package
import Web3 from 'web3';
import axios from 'axios';
import Cookies from 'js-cookie';

const { VITE_APP_ENDPOINT, VITE_APP_CHAIN_ID, VITE_APP_TOKEN_NAME } = import.meta.env;

interface Web3ContextState {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  chainId: string | null;
  token: string | null;
  tokenId: number | null;
  error: Error | null;
  web3: any | null; // Using any for now to avoid type issues
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const Web3Context = createContext<Web3ContextState | null>(null);

interface Web3ProviderProps {
  children: ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const [web3, setWeb3] = useState<any | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(Cookies.get(VITE_APP_TOKEN_NAME) || null);
  const [tokenId, setTokenId] = useState<number | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Initialize Web3 instance
  const initializeWeb3 = () => {
    if (typeof window.ethereum !== 'undefined') {
      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);
      return web3Instance;
    }
    return null;
  };

  // Check if the wallet is on the correct network
  const checkNetwork = async (web3Instance: any) => {
    const chainId = await window.ethereum?.request({ method: 'eth_chainId' });
    if (chainId !== VITE_APP_CHAIN_ID) {
      throw new Error(`Please switch to the correct network (Chain ID: ${VITE_APP_CHAIN_ID})`);
    }
    return chainId;
  };

  // Handle wallet events
  useEffect(() => {
    if (!window.ethereum) return;

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

    const handleDisconnect = () => {
      disconnect();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('disconnect', handleDisconnect);

    return () => {
      window.ethereum?.off('accountsChanged', handleAccountsChanged);
      window.ethereum?.off('chainChanged', handleChainChanged);
      window.ethereum?.off('disconnect', handleDisconnect);
    };
  }, []);

  // Check token validity
  useEffect(() => {
    const validateToken = async () => {
      if (!token || !isConnected) return;

      try {
        const { data } = await axios.post(`${VITE_APP_ENDPOINT}chained-horse/auth/check-token`, { token });
        if (!data.valid) {
          await disconnect();
        } else {
          setTokenId(data.tokenId);
        }
      } catch (err) {
        await disconnect();
      }
    };

    validateToken();
  }, [token, isConnected]);

  const connect = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      // Initialize Web3
      const web3Instance = initializeWeb3();
      if (!web3Instance) {
        throw new Error('Please install MetaMask');
      }

      // Check network
      const currentChainId = await checkNetwork(web3Instance);
      setChainId(currentChainId);

      // Request accounts
      const accounts = await window.ethereum?.request({ method: 'eth_requestAccounts' });
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