import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import axios from 'axios'
import Cookies from 'js-cookie'
import Web3 from 'web3'
import AppView from './AppView'
import { API } from './api'
import { FamilyUser } from './types/auth'

const { VITE_APP_CHAIN_ID } = import.meta.env
const TOKEN_NAME = 'kf-token'

const emptyUser = (): FamilyUser => ({
    valid: false,
    followers: [],
    following: [],
    balance: 0,
    birthed: 0,
    balanceAll: 0,
    address: undefined,
})

const chainOk = (chainId: string) =>
    String(VITE_APP_CHAIN_ID || '0x1').includes(chainId)

function App() {
    const [loggedIn, setLoggedIn] = useState<string | undefined>(undefined)
    const [token, setToken] = useState<string | undefined>(Cookies.get(TOKEN_NAME) || undefined)
    const [user, setUser] = useState<FamilyUser>(emptyUser())
    const [loading, setLoading] = useState(Boolean(Cookies.get(TOKEN_NAME) && window.ethereum))
    const web3 = window.ethereum ? new Web3(window.ethereum) : new Web3()

    const handleLogout = useCallback(() => {
        Cookies.remove(TOKEN_NAME)
        setLoggedIn(undefined)
        setToken(undefined)
        setUser(emptyUser())
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
                alert('you are on the wrong chain!')
                return
            }
            await window.ethereum.request({ method: 'eth_requestAccounts' })
            const signer = new Web3(window.ethereum)
            const message = 'Sign this message to authenticate'
            const accounts = await signer.eth.getAccounts()
            const signature = await signer.eth.personal.sign(message, accounts[0], '')
            const { data } = await axios.post(`${API}/kittyfamily-auth`, {
                address: accounts[0],
                signature,
                message,
            })
            Cookies.set(TOKEN_NAME, data.token)
            const address = (data.address || accounts[0]).toLowerCase()
            setLoggedIn(address)
            setToken(data.token)
            setUser(data)
            return address
        } catch (error) {
            console.error('Error:', error)
        }
    }

    const handleSignOut = async () => {
        if (!token) return
        try {
            await axios.post(`${API}/kittyfamily-auth/logout`, { token })
        } catch (error) {
            console.error('Logout error:', error)
        }
        handleLogout()
    }

    const checkToken = useCallback(async () => {
        try {
            const chainId = await window.ethereum?.request({ method: 'eth_chainId' }) as string
            if (chainOk(chainId)) {
                const { data } = await axios.post(`${API}/kittyfamily-auth/check-token`, { token })
                if (data.valid) {
                    setLoggedIn(data.address.toLowerCase())
                    setUser(data)
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
            <AppView {...{ loggedIn, handleSignIn, handleSignOut, web3, user, token, checkToken }} />
        </BrowserRouter>
    )
}

export default App
