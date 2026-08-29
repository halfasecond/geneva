// @ts-nocheck
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Message from 'kittyFamily/components/Message'
import Messages from 'kittyFamily/components/Messages'
import Menu from 'kittyFamily/components/Menu'
import * as Styled from './Chat.style'
import { API } from 'kittyFamily/api'

const Chat = ({ loggedIn, socket, user, catsWithHats }) => {
    const [open, setOpen] = useState(false)
    const [messages, setMessages] = useState([])
    const [profiles, setProfiles] = useState([])
    const [results, setResults] = useState([])
    const [hats, setHats] = useState([])
    const [balance, setBalance] = useState(0)

    const toggleDiv = () => setOpen(!open)

    useEffect(() => {
        if (loggedIn) {
            const getBalance = async () => {
                const { data } = await axios.get(`${API}/kittyfamily-accounts?accounts=${loggedIn.toLowerCase()}`)
                if (data.length === 1) {
                    const { balance } = data[0]
                    setBalance(balance)
                }
            }
            getBalance()
        }
    }, [loggedIn])

    useEffect(() => {
        if (socket) {
        const handleMessages = (data) => {
            setMessages([...data].reverse())
        }

        socket.on('messages', handleMessages)
        socket.emit('getMessages')

        return () => {
            socket.off('messages', handleMessages)
        }
        }
    }, [socket])

    useEffect(() => {
        const fetchAccountData = async () => {
        if (messages.length > 0) {
            const uniqueAddresses = [...new Set(messages.map(({ account }) => account && account.toLowerCase()))].filter(Boolean)
            if (uniqueAddresses.length > 0) {
                try {
                    const response = await axios.get(`${API}/kittyfamily-accounts?accounts=${uniqueAddresses}`)
                    const uniqueIds = [...new Set(response.data.map(({ avatar }) => avatar > -1 && avatar))].filter(Boolean)
                    const { data: { kitties } } = await axios.get(`${API}/cryptokitties/nfts?search=id:${uniqueIds.join(',')}`)
                    const ids = kitties.map(({ tokenId }) => tokenId).join(',')
                    axios.get(`https://api.cryptokitties.co/v3/kitties?search=id:${ids}&limit=20`).then(async ckResult => {
                        const { data: { kitties: ckData } } = ckResult
                        const _kitties = kitties.map(kitty => {
                            return { ...ckData.find(ck => ck.id === kitty.tokenId), ...kitty };
                        });
                        setResults(_kitties)
                        setProfiles([...new Set(response.data
                            .filter(({ avatar }) => avatar > -1)
                            .map(({ avatar, address, balance, displayName }) => ({ avatar, address, balance, displayName }))
                        )])
                    })
                } catch (error) {
                    console.error('Error fetching profiles:', error)
                }
            }
        }
        }

        fetchAccountData()
    }, [messages])

    return (
        <>
            <Menu handleClick={toggleDiv} {...{ loggedIn, catsWithHats }} />
            <Styled.Div {...{ open }}>
                <header>
                    <h2>#KittyChat</h2>
                    <div onClick={toggleDiv}>X</div>
                </header>
                {profiles && <Message {...{ loggedIn, socket, profiles }} user={{ ...user, balance }}  />}
                {profiles && results && <Messages {...{ messages, profiles, results, hats, socket }} />}
            </Styled.Div>
        </>
    )
}

export default Chat
