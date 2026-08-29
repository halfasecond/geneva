import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { API } from 'kittyNews/api'
import Header from 'kittyNews/components/Header'
import Logo from 'kittyNews/components/Logo'
import Menu from 'kittyNews/components/Menu'
import Article from 'kittyNews/pages/Article'
import Cms from 'kittyNews/pages/Cms'
import Homepage from 'kittyNews/pages/Homepage'
import News from 'kittyNews/pages/News'
import { io, Socket } from 'socket.io-client'
import * as Styled from 'kittyNews/style'
import { AuthProps } from 'kittyNews/types/auth'
import { ReportType } from 'kittyNews/types/report'
import { Contract } from 'web3-eth-contract'
import { AbiFragment } from 'web3'
import PurrContracts from './contracts/Purr'
import CryptoKitties from './contracts/CryptoKitties'
import Web3 from 'web3'

const { VITE_APP_KN_ADMIN } = import.meta.env
const admin = VITE_APP_KN_ADMIN ? VITE_APP_KN_ADMIN.split(',').map((w: string) => w.toLowerCase()) : []

const web3 = new Web3((window.ethereum as any));

const getContract = (abi: AbiFragment[], address: string) => new web3.eth.Contract(abi, address)

const cryptokitties: Contract<AbiFragment[]> = getContract(CryptoKitties.Core.abi, CryptoKitties.Core.addr)
const purr: Contract<AbiFragment[]> = getContract(PurrContracts.Purr.abi, PurrContracts.Purr.addr)
const purrClaim: Contract<AbiFragment[]> = getContract(PurrContracts.PurrClaim.abi, PurrContracts.PurrClaim.addr)

const AppView: React.FC<AuthProps> = ({ handleSignIn, handleSignOut, loggedIn, token }) => {
    

    const [socket, setSocket] = useState<Socket>()
    const [report, setReport] = useState<ReportType>()
    const [ethBlock, setEthBlock] = useState<{ blocknumber: number, timestamp: number }>()
    const [floor, setFloor] = useState<ReportType>()
    const [births, setBirths] = useState<ReportType>()
    const [transfers, setTransfers] = useState<ReportType>()
    const [purrBalance, setPurrBalance] = useState<string | undefined>()
    const [purrClaimBalance, setPurrClaimBalance] = useState<string | undefined>()
    const [claims, setClaims] = useState<ReportType>()

    const getPurrClaimBalance = async () => {
        try {
            if (loggedIn) {
                const balanceOf = await purr.methods.balanceOf(PurrContracts.PurrClaim.addr).call();
                if (balanceOf !== undefined && balanceOf !== null) {
                    return setPurrClaimBalance(balanceOf.toString())
                }
            }
            const { data: { balance } } = await axios.get(`${API}/purr/balances/${PurrContracts.PurrClaim.addr}`)
            return setPurrClaimBalance(balance.toString())
        } catch (e) {
            console.log(e)
            return setPurrClaimBalance('0')
        }
    }

    const getUserBalance = async () => {
        try {
            const balanceOf = await purr.methods.balanceOf(loggedIn).call()
            if (balanceOf) return setPurrBalance(balanceOf.toString())
        } catch (e) {
            console.log(e)
        }
        try {
            const { data: { balance } } = await axios.get(`${API}/purr/balances/${loggedIn}`)
            setPurrBalance(balance.toString())
        } catch (e) {
            console.log(e)
        }
    }

    const getClaims = async () => {
        try {
            const { data } = await axios.get(`${API}/purr/claims`)
            const tokenIds = data.map(({ tokenId }: { tokenId: number }) => +tokenId).reverse()
            const { data: { kitties } } = await axios.get(`${API}/cryptokitties/nfts?search=id:${tokenIds.slice(0, 20).join(',')}`)
            const tokenIdMap = tokenIds.slice(0, 20).reduce((map: { [key: number]: number }, tokenId: number, index: number) => {
                map[tokenId] = index
                return map
            }, {})
            const sortedKitties = kitties.sort((a: any, b: any) => tokenIdMap[a.tokenId] - tokenIdMap[b.tokenId])
            const kittiesWithAmount = sortedKitties.map((kitty: any) => ({
                ...kitty,
                value: data.find((item: { tokenId: number }) => item.tokenId === kitty.tokenId)?.amount || 0
            }))
            setClaims(kittiesWithAmount)
        } catch (e) {
            console.log(e)
        }
    }

    const updateBalances = () => {
        setPurrClaimBalance(undefined)
        setPurrBalance(undefined)
        if (loggedIn) {
            getUserBalance()
        }
        getPurrClaimBalance()
        getClaims()
    }

    useEffect(() => {
        if (loggedIn) {
            getUserBalance()
            getClaims()
        }
        getPurrClaimBalance()
    }, [loggedIn])

    useEffect(() => {
        const _socket = io(API + '/kittynews', {
            autoConnect: false,
            transports: ['websocket'],
            auth: { token },
        })
        _socket.on('connect_error', (err) => console.log(`connect_error due to ${err}`))
        _socket.on('ckReport', (data: ReportType) => setReport(data))
        _socket.on('newEthBlock', (data: { blocknumber: number, timestamp: number }) => setEthBlock(data))
        _socket.on('ckFloor', (data: ReportType) => setFloor((prev) => ({ ...(prev || {}), ...data })))
        _socket.on('ckBirth', (data: ReportType) => setBirths(data))
        _socket.on('ckTransfer', (data: ReportType) => setTransfers(data))
        _socket.on('connect', () => setSocket(_socket))
        _socket.on('disconnect', () => setSocket(undefined))
        _socket.connect()
        return () => {
            _socket.removeAllListeners()
            _socket.close()
            setSocket(undefined)
        }
    }, [token])

    const endpoint = `${API}/kittynews/cms`

    return (
        <Router>
            <ScrollToTop />
            <Header {...{ handleSignIn, handleSignOut, loggedIn, token }} />
            {(loggedIn && admin.includes(loggedIn)) && <Menu />}
            {socket && <Logo {...{ socket, report, ethBlock }} />}
            <Styled.Main>
                <Routes>
                    <Route path="/" element={<Homepage walletAddress={loggedIn} {...{ report, births, transfers, floor, endpoint, cryptokitties, claims, purr, purrClaim, purrBalance, purrClaimBalance, updateBalances, handleSignIn }} />} />
                    <Route path="/article/:slug" element={<Article {...{ endpoint, report }} admin={(loggedIn && admin.includes(loggedIn))} />} />
                    <Route path="/news/:slug" element={<News {...{ endpoint }} admin={(loggedIn && admin.includes(loggedIn))} />} />
                    <Route 
                        path="/cms" 
                        element={
                            <ProtectedRoute 
                                {...{ loggedIn }}
                                element={
                                    <Cms 
                                        wallet={loggedIn}
                                        module={'kittynews'} 
                                        { ...{ endpoint }}
                                    />
                                }
                            />
                        }
                    />
                    <Route
                        path="/cms/:slug"
                        element={
                            <ProtectedRoute 
                                {...{ loggedIn }}
                                element={
                                    <Cms 
                                        wallet={loggedIn}
                                        module={'kittynews'}
                                        { ...{ endpoint }}
                                    />
                                }
                            />
                        }
                    />
                </Routes>
            </Styled.Main>
        </Router>
    )
}

const ScrollToTop: React.FC = () => {
    const { pathname } = useLocation()
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [pathname])
    return null
}

interface ProtectedRouteProps {
    element: React.ReactElement;
    loggedIn: string | undefined;
}
  
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element, loggedIn }) => {
    return loggedIn && admin.includes(loggedIn) ? element : <Navigate to="/" replace />
}

export default AppView