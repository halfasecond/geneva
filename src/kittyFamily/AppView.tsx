// @ts-nocheck
import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import axios from 'axios'
import { io } from 'socket.io-client'
import Homepage from 'kittyFamily/pages/Homepage'
import FamilyTree from 'kittyFamily/pages/FamilyTree'
import Profile from 'kittyFamily/pages/Profile'
import KittyHats from 'kittyFamily/pages/KittyHats'
import Report from 'kittyFamily/pages/Report'
import Total from 'kittyFamily/components/Total'
import ScrollTop from 'kittyFamily/components/ScrollTop'
import Chat from 'kittyFamily/components/Chat'
import Confetti from 'kittyFamily/components/Confetti'
import CryptoKittiesContract from 'kittyFamily/contracts/cryptokitties'
import Contract from 'kittyFamily/contracts/kitty-hats'
import Connect from 'kittyFamily/components/Connect'
import Search from 'kittyFamily/pages/Search'
import { API } from 'kittyFamily/api'

const AppView = ({ loggedIn, handleSignIn, handleSignOut, web3, user, token, checkToken }) => {
    const [socket, setSocket] = useState(undefined)
    const [hats, setHats] = useState(undefined)
    const [allHatEvents, setAllHatEvents] = useState()
    const [total, setTotal] = useState(undefined)
    const [catsWithHats, setCatsWithHats] = useState(undefined)
    const [searchables, setSearchables] = useState([])
    const [showCelebration, setShowCelebration] = useState(false)

    useEffect(() => {
        const getSearchables = async () => {
            const { data } = await axios(`${API}/cryptokitties/cattributes`)
            setSearchables(data)
        }
        getSearchables()
    }, [])

    useEffect(() => {
        const getKittyHats = async () => {
            const { data } = await axios.get(`${API}/kitty-hats/hats`)
            const _data = [...data.filter(({ available }) => available > 0), ...data.filter(({ available }) => available < 1)]
            setHats(_data)
        }
        getKittyHats()
    }, [])

    useEffect(() => {
        const _socket = io(`${API}/kittyfamily`, { transports: ['websocket'], auth: { token } })
        _socket.on('connect_error', (err) => console.log(`connect_error due to ${err}`))
        _socket.on('connect', () => setSocket(_socket))
        _socket.on('disconnect', () => setSocket(null))
        _socket.emit('ckReport')
        return () => {
            _socket.close()
            setSocket(null)
        }
    }, [token])

    const handlePurchase = async (tokenId, value) => {
        try {
            if (loggedIn) {
                const instance = new web3.eth.Contract(
                    CryptoKittiesContract.Sale.abi,
                    CryptoKittiesContract.Sale.addr,
                )
                const gas = await instance.methods.bid(tokenId).estimateGas({ from: loggedIn, value })
                await instance.methods.bid(tokenId).send({ from: loggedIn, value, gas })
                return true
            }
            handleSignIn()
            return false
        } catch (e) {
            console.log(e)
            return false
        }
    }

    const handleHatPurchase = async (item, value) => {
        const _item = item.replace('Item', '')
        try {
            if (loggedIn) {
                const instance = new web3.eth.Contract(Contract.Core.abi, Contract.Core.addr)
                const gas = await instance.methods.buyItem(_item, '1').estimateGas({ from: loggedIn, value })
                await instance.methods.buyItem(_item, '1').send({ from: loggedIn, value, gas })
                setShowCelebration(true)
                return true
            }
            handleSignIn()
            return false
        } catch (e) {
            console.log(e)
            return false
        }
    }

    const handleHatPurchaseAndApply = async (tokenId, item) => {
        const _item = item.replace('Item', '')
        try {
            if (loggedIn) {
                const instance = new web3.eth.Contract(Contract.Core.abi, Contract.Core.addr)
                const checkItem = await instance.methods.getItem(_item).call()
                const value = Array.isArray(checkItem) ? checkItem[1] : checkItem[1]
                try {
                    const gas = await instance.methods.buyItemAndApply(_item, tokenId).estimateGas({ from: loggedIn, value })
                    await instance.methods.buyItemAndApply(_item, tokenId).send({ from: loggedIn, value, gas })
                    setShowCelebration(true)
                    return true
                } catch (e) {
                    console.log(e)
                }
            } else {
                handleSignIn()
                return false
            }
        } catch (e) {
            console.log(e)
            return false
        }
    }

    useEffect(() => {
        if (!showCelebration) return undefined
        const timeoutId = setTimeout(() => setShowCelebration(false), 2000)
        return () => clearTimeout(timeoutId)
    }, [showCelebration])

    const addNotification = ({ tokenId }) => {
        setTotal(tokenId)
    }

    return (
        <>
            {showCelebration && <Confetti usePortal />}
            <Total {...{ socket }} emit={addNotification} />
            <ScrollTop>
                <Routes>
                    <Route path="/" element={<Homepage {...{ total, hats, allHatEvents, loggedIn, web3, searchables, handleHatPurchase, handleHatPurchaseAndApply, handleSignIn }} />} />
                    <Route path="/kitty/:id" element={<FamilyTree {...{ loggedIn, handlePurchase, searchables }} />} />
                    <Route path="/profile/:profile" element={<Profile {...{ loggedIn, handlePurchase, searchables, token, handleSignIn, user, checkToken }} />} />
                    <Route path="/kitty-hats" element={<KittyHats {...{ hats, allHatEvents, loggedIn, searchables, web3, handleHatPurchase, handleHatPurchaseAndApply, handleSignIn }} />} />
                    <Route path="/search" element={searchables ? <Search {...{ searchables, handlePurchase }} account={{ wallet: loggedIn }} /> : null} />
                    <Route path="/report" element={<Report {...{ socket }} />} />
                </Routes>
                <Chat {...{ loggedIn, socket, user, catsWithHats, token }} />
                <Connect {...{ loggedIn, handleSignIn, handleSignOut }} />
            </ScrollTop>
        </>
    )
}

export default AppView
