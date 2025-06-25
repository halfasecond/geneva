import * as Styled from './style'
import { AuthProps } from 'types/auth'
import axios from 'axios'
import { Contract } from 'web3-eth-contract'
import { BrowserRouter as Router, Link } from 'react-router-dom'
import { useSocket } from './hooks/useSocket'
import parts from './flowbots'
import { useEffect, useState } from 'react'
import { getContract } from '../../utils'
import { AbiFragment } from 'web3'
import Egg from '../../contracts/Egg'
import nfts from 'src/server/modules/chained-horse/models/nfts'

const { VITE_APP_CDN_URL } = import.meta.env;

// CryptoKitties contracts:
const { Egg: { abi, addr } } = Egg
const egg: Contract<AbiFragment[]> = getContract(abi, addr)

const Geneva: React.FC<AuthProps> = ({ token, BASE_URL }) => {
    const [incorrectOwners1, setIncorrectOwners1] = useState([])
    const [nfts1, setNFTs1] = useState(0)
    const [index1, setIndex1] = useState(0)
    const {
        block,
    } = useSocket({ token });

    useEffect(() => {
        console.log(block)
    }, [block])

    useEffect(() => {
        const getOwners = async () => {
            const { data: eggs } = await axios.get(`https://nft-game-server.production.cryptokitties.dapperlabs.com/egg/nfts`)
            // const { data: eggs } = await axios.get(`http://localhost:8000/egg/nfts`)
            setNFTs1(eggs.length)

            let allIncorrectOwners = [];

            for (let i = 0; i < eggs.length; i++) {
                const getOwner = await egg.methods.ownerOf(eggs[i].tokenId).call()
                if (getOwner.toLowerCase() !== eggs[i].owner.toLowerCase()) {
                    allIncorrectOwners.push({ tokenId: eggs[i].tokenId, owner: getOwner, listedOwner: eggs[i].owner })
                }
                setIndex1(i)
            }
            setIncorrectOwners1(allIncorrectOwners)
        }
        getOwners()
    }, [])

    return (
        <Router basename={BASE_URL.startsWith('./') ? '/' : BASE_URL}>
            <Styled.Main>
                <h1>NFT Game Server audit (prod)</h1>
                <p>Assets: <b>{nfts1}</b> - audit: {(100 / nfts1) * (index1 + 1)}%</p>
                <ul>
                    {incorrectOwners1.map(({ tokenId, owner, listedOwner }, i) =>
                        <li key={i}>{tokenId} - actual owner: {owner} - listed owner: {listedOwner}</li>
                    )}
                </ul>
            </Styled.Main>
        </Router>
    )
}

export default Geneva