import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import axios from 'axios'
import Cookies from 'js-cookie'
import Web3 from 'web3'
import AppView from './AppView'
import { API } from './api'

interface AuthResponse {
    token: string
}

interface CheckTokenResponse {
    valid: boolean
    address: string
}

const { VITE_APP_CHAIN_ID } = import.meta.env
const TOKEN_NAME = 'kitty-international'

const chainOk = (chainId: string) =>
    String(VITE_APP_CHAIN_ID || '0x1').includes(chainId)

function App() {
    const [loggedIn, setLoggedIn] = useState<string | undefined>(undefined)
    const [token, setToken] = useState<string | undefined>(Cookies.get(TOKEN_NAME) || undefined)
    const [loading, setLoading] = useState(true)

    const handleLogout = useCallback(() => {
        Cookies.remove(TOKEN_NAME)
        setLoggedIn(undefined)
        setToken(undefined)
        setLoading(false)
    }, [])

    useEffect(() => {
        const handleAccountsChanged = (accounts: string[]) => {
            if (accounts.length === 0 && loggedIn) handleLogout()
        }
        const handleDisconnect = (error: { message: string }) => {
            console.error('Metamask error:', error.message)
            handleLogout()
        }
        const handleReload = () => window.location.reload()

        if (token && loggedIn && window.ethereum) {
            window.ethereum.on('accountsChanged', handleAccountsChanged)
            window.ethereum.on('disconnect', handleDisconnect)
            window.ethereum.on('chainChanged', handleReload)
            return () => {
                window.ethereum?.off('accountsChanged', handleAccountsChanged)
                window.ethereum?.off('disconnect', handleDisconnect)
                window.ethereum?.off('chainChanged', handleReload)
            }
        }
    }, [token, loggedIn, handleLogout])

    const handleSignIn = async () => {
        if (!window.ethereum) return
        try {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' }) as string
            if (!chainOk(chainId)) {
                alert('You are on the wrong chain!')
                return
            }
            await window.ethereum.request({ method: 'eth_requestAccounts' })
            const web3 = new Web3(window.ethereum)
            const message = 'Sign this message to authenticate'
            const accounts = await web3.eth.getAccounts()
            const signature = await web3.eth.personal.sign(message, accounts[0], '')
            const { data } = await axios.post<AuthResponse>(`${API}/kittyinternational/auth`, {
                address: accounts[0],
                signature,
                message,
            })
            Cookies.set(TOKEN_NAME, data.token)
            setLoggedIn(accounts[0].toLowerCase())
            setToken(data.token)
        } catch (error) {
            console.error('Error during sign in:', error)
        }
    }

    const handleSignOut = async () => {
        if (!token) return
        try {
            await axios.post(`${API}/kittyinternational/auth/logout`, { token })
        } catch (error) {
            console.error('Logout error:', error)
        } finally {
            handleLogout()
        }
    }

    const checkToken = useCallback(async () => {
        try {
            const chainId = await window.ethereum?.request({ method: 'eth_chainId' }) as string
            if (chainOk(chainId)) {
                const { data } = await axios.post<CheckTokenResponse>(
                    `${API}/kittyinternational/auth/check-token`,
                    { token },
                )
                if (data.valid) {
                    setLoggedIn(data.address.toLowerCase())
                } else {
                    handleLogout()
                }
            }
        } catch {
            handleLogout()
        } finally {
            setLoading(false)
        }
    }, [token, handleLogout])

    useEffect(() => {
        if (token && window.ethereum) {
            checkToken()
        } else {
            setLoading(false)
        }
    }, [token, checkToken])

    if (loading) return null

    return (
        <BrowserRouter>
            <AppView {...{ handleSignIn, handleSignOut, loggedIn, token }} />
        </BrowserRouter>
    )
}

export default App
