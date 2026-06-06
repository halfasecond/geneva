import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom'
import Web3 from 'web3'
import { toWei } from 'web3-utils'
import io, { Socket } from 'socket.io-client'
// import useCurrentUser from 'hooks/useCurrentUser'
// import LoginC2A from 'components/LoginC2A'
import Flowbot from '../Flowbot'
import Intro from '../Intro'
import Holding from '../Holding'
import Metamask from 'components/Metamask'
// import MenuC2A from 'components/MenuC2A'
import Notifications from '../Notifications'
import Search from '../Search'
import Contracts from './contracts'
// import SettingsC2A from 'components/SettingsC2A'
import { Counts } from '../Counts/count.types'
import { AuthProps } from 'types/auth'


const web3 = new Web3("http://localhost:8545")

const { VITE_APP_ENDPOINT, VITE_APP_RELEASED } = import.meta.env;

// type AwardType = keyof typeof __counts;

const AppView: React.FC<AuthProps> = ({ handleSignIn, handleSignOut, loggedIn, token, BASE_URL }) => {
    console.log(BASE_URL, '++')
    // const user = useCurrentUser()
    const [counts, setCounts] = useState<Counts | undefined>(undefined)
    const [activeAuction, setActiveAuction] = useState<number | undefined>(undefined)
    const [countdown, setCountdown] = useState<number>(0)
    const [socket, setSocket] = useState<Socket | null>(null)

    useEffect(() => {
        const closeSocket = () => {
            if (socket) {
                socket.close()
                setSocket(null)
            }
        }
        const createSocket = () => {
            const _socket = io(VITE_APP_ENDPOINT, { transports: ['websocket'] })
            _socket.on('connect_error', (err) => { console.log(`connect_error due to ${err}`) })
            _socket.on('connect', () => { setSocket(_socket) })
            _socket.on('disconnect', () => { setSocket(null) })
            _socket.on('searchTypes', searchTypes => { setCounts(searchTypes) })
        }
      
        closeSocket() // Close the existing socket and create a new one when the component mounts
        if (VITE_APP_RELEASED) {
            createSocket()
            return () => {
                closeSocket()
            }
        }
    }, [])

    const getAuctionState = async () => {
        const { abi, addr } = Contracts.flowbots.auction;
        try {
            // const chainId = await web3.eth.getChainId();
            const instance = new web3.eth.Contract(abi, addr);
            // Attempt to call activeAuction
            const _activeAuction: bigint = await instance.methods.activeAuction().call();
            const auctionEndTime: bigint = await instance.methods.auctionEndTime().call();
            setActiveAuction(Number(_activeAuction))
            const utcSeconds = Math.floor(new Date().getTime() / 1000);
            const _countdown = Number(auctionEndTime) > utcSeconds ? Math.ceil(Number(auctionEndTime) - utcSeconds) : 0
            setCountdown(_countdown)
        } catch (e: any) {
            if (e.message.includes("The bot factory isn't open yet!")) {
                console.error('Auction not yet active. Message:', e.message);
            } else {
                console.error('Error during getAuctionState:', e.message);
            }
        }
    };

    // useEffect(() => {
    //     getAuctionState()
    // }, [])

    useEffect(() => {
        if (countdown > 0) {
            decrementTimer(countdown);
        } else {
            const targetDate = new Date('2024-12-17T01:30:00')
            const currentDate = new Date()
            const timeInSeconds = Math.floor((targetDate.getTime() - currentDate.getTime()) / 1000)
            if (timeInSeconds > 0) {
                setCountdown(timeInSeconds)
            }
        }
    }, [countdown])

    const decrementTimer = (currentTime: number) => setTimeout(() => setCountdown(currentTime - 1), 1000)

    const endAuction = async (from: string) => {
        const { abi, addr } = Contracts.flowbots.auction
        const instance = new web3.eth.Contract(abi, addr)
        await instance.methods.auctionEnd(activeAuction).send({ from })
        await new Promise((resolve) => setTimeout(resolve, 2000))
        getAuctionState()
    }

    const init = async (from: string) => {
        const { abi, addr } = Contracts.flowbots.auction
        const instance = new web3.eth.Contract(abi, addr)
        await instance.methods.init().send({ from, value: toWei('0.1', 'ether') })
        getAuctionState()
    }

    const buyNow = async (from: string, tokenId: number, value: string): Promise<string> => {
        const { abi, addr } = Contracts.flowbots.auction
        const instance = new web3.eth.Contract(abi, addr)
        await instance.methods.buyNow(tokenId).send({ from, value })
        await new Promise((resolve) => setTimeout(resolve, 2000))
        return 'success'
    }

    const bid = async (from: string, tokenId: number, value: string): Promise<string> => {
        const { abi, addr } = Contracts.flowbots.auction
        const instance = new web3.eth.Contract(abi, addr)
        await instance.methods.bid(tokenId).send({ from, value })
        await new Promise((resolve) => setTimeout(resolve, 2000))
        return 'success'
    }

    const createAuction = async (from: string, tokenId: number, startPrice: string, endPrice: string, duration: string) => {
        const { abi, addr } = Contracts.flowbots.auction
        const instance = new web3.eth.Contract(abi, addr)
        const auction = startPrice === endPrice
            ? await instance.methods.addBuyNowSale(tokenId, toWei(startPrice, 'ether')).send({ from })
            : await instance.methods.createAuction(tokenId.toString(), toWei(startPrice, 'ether'), toWei(endPrice, 'ether'), duration).send({ from })
        await new Promise((resolve) => setTimeout(resolve, 2000))
        return auction
    }

    const cancelAuction = async (from: string, tokenId: number) => {
        const { abi, addr } = Contracts.flowbots.auction
        const instance = new web3.eth.Contract(abi, addr)
        const auction = await instance.methods.cancelSale(tokenId).send({ from })
        await new Promise((resolve) => setTimeout(resolve, 2000))
        return auction
    }

    const approve = async (from: string, address: string, tokenId: number) => {
        const { abi, addr } = Contracts.flowbots.core
        const instance = new web3.eth.Contract(abi, addr)
        await instance.methods.approve(address, tokenId.toString()).send({ from })
        await new Promise((resolve) => setTimeout(resolve, 2000))
        return 'success'
    }

    const getApproved = async (tokenId: number) => {
        const { abi, addr } = Contracts.flowbots.core
        const instance = new web3.eth.Contract(abi, addr)
        const approved = await instance.methods.getApproved(tokenId.toString()).call()
        await new Promise((resolve) => setTimeout(resolve, 2000))
        return approved
    }

    return (
       <Router basename={BASE_URL.startsWith('./') ? '/' : BASE_URL}>
            <ScrollToTop />
            {/* user && <LoginC2A {...{ user }} /> */}
            {socket && <Notifications {...{ socket }} />}
            {/* <SettingsC2A /> */}
            {/* <MenuC2A /> */}
            <Metamask {...{ handleSignIn, handleSignOut, loggedIn, token, BASE_URL }} />
            {!VITE_APP_RELEASED ? (
                <Routes>
                    <Route path={'/'} element={<Intro {...{ counts, activeAuction, init, loggedIn, handleSignIn, endAuction, countdown }} />} />
                    <Route path={'/flowbot/:id'} element={<Flowbot {...{ activeAuction, countdown, loggedIn, handleSignIn, approve, getApproved, buyNow, bid, cancelAuction, endAuction, createAuction }}  />} />
                    <Route path={'/search'} element={<Search {...{ counts, activeAuction, loggedIn }} />} />
                </Routes>
            ) : (
                <Holding {...{ countdown }} />
            )}
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

export default AppView
