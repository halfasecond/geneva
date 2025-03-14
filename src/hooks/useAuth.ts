import { useCallback, useState, useEffect } from 'react';
import Web3 from 'web3';
import axios from 'axios';
import Cookies from 'js-cookie';

interface AuthResponse {
    token: string;
    tokenId?: number;
}

interface CheckTokenResponse {
    valid: boolean;
    address: string;
    tokenId?: number;
}

interface UseAuthOptions {
    appName: string;
}

export function useAuth({ appName }: UseAuthOptions) {
    const { VITE_APP_ENDPOINT, VITE_APP_CHAIN_ID, VITE_APP_TOKEN_NAME } = import.meta.env;
    const BASE_URL = import.meta.env.BASE_URL ? import.meta.env.BASE_URL : '/';

    const [loggedIn, setLoggedIn] = useState<string | undefined>(undefined);
    const [token, setToken] = useState<string | undefined>(Cookies.get(VITE_APP_TOKEN_NAME) || undefined);
    const [tokenId, setTokenId] = useState<number | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    const handleLogout = useCallback(() => {
        Cookies.remove(VITE_APP_TOKEN_NAME);
        setLoggedIn(undefined);
        setToken(undefined);
        setTokenId(undefined);
        setLoading(false);
    }, [VITE_APP_TOKEN_NAME]);

    useEffect(() => {
        const handleAccountsChanged = (accounts: string[]) => {
            if (accounts.length === 0 && loggedIn) {
                handleLogout();
            }
        };

        const handleDisconnect = (error: { message: string }) => {
            console.error('Metamask error:', error.message);
            handleLogout();
        };

        const handleReload = () => window.location.reload();

        if (token && loggedIn && window.ethereum) {
            (window.ethereum as any).on('accountsChanged', handleAccountsChanged);
            (window.ethereum as any).on('disconnect', handleDisconnect);
            (window.ethereum as any).on('chainChanged', handleReload);

            return () => {
                (window.ethereum as any).off('accountsChanged', handleAccountsChanged);
                (window.ethereum as any).off('disconnect', handleDisconnect);
                (window.ethereum as any).off('chainChanged', handleReload);
            };
        }
    }, [token, loggedIn, handleLogout]);

    const handleSignIn = useCallback(async () => {
        if (window.ethereum) {
            try {
                const chainId = await (window.ethereum as any).request({ method: 'eth_chainId' });
                if (chainId === VITE_APP_CHAIN_ID) {
                    await (window.ethereum as any).request({ method: 'eth_requestAccounts' });
                    const web3 = new Web3((window.ethereum as any));
                    const message = 'Sign this message to authenticate';
                    const accounts = await web3.eth.getAccounts();
                    const signature = await web3.eth.personal.sign(message, accounts[0], '');
                    const { data } = await axios.post<AuthResponse>(`${VITE_APP_ENDPOINT}${appName}/auth`, { 
                        address: accounts[0], 
                        signature, 
                        message 
                    });
                    Cookies.set(VITE_APP_TOKEN_NAME, data.token);
                    setLoggedIn(accounts[0]);
                    setToken(data.token);
                } else {
                    alert('You are on the wrong chain!');
                }
            } catch (error) {
                console.error('Error during sign in:', error);
            }
        }
    }, [VITE_APP_CHAIN_ID, VITE_APP_ENDPOINT, VITE_APP_TOKEN_NAME, appName]);

    const handleSignOut = useCallback(async () => {
        if (token) {
            try {
                await axios.post(`${VITE_APP_ENDPOINT}${appName}/auth/logout`, { token });
            } catch (error) {
                console.error('Logout error:', error);
            } finally {
                handleLogout();
            }
        }
    }, [VITE_APP_ENDPOINT, appName, handleLogout, token]);

    const checkToken = useCallback(async () => {
        try {
            const chainId = await (window.ethereum as any).request({ method: 'eth_chainId' });
            if (chainId === VITE_APP_CHAIN_ID) {
                const { data } = await axios.post<CheckTokenResponse>(
                    `${VITE_APP_ENDPOINT}${appName}/auth/check-token`, 
                    { token }
                );
                if (data.valid) {
                    setLoggedIn(data.address.toLowerCase());
                    setTokenId(data.tokenId);
                } else {
                    handleLogout();
                }
            }
        } catch (error) {
            handleLogout();
        } finally {
            setLoading(false);
        }
    }, [VITE_APP_CHAIN_ID, VITE_APP_ENDPOINT, appName, handleLogout, token]);

    useEffect(() => {
        if (token && window.ethereum) {
            checkToken();
        } else {
            setLoading(false);
        }
    }, [token, checkToken]);

    return {
        loggedIn,
        token,
        tokenId,
        loading,
        handleSignIn,
        handleSignOut,
        BASE_URL
    };
}