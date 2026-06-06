import * as Styled from './Home.style'
import { AuthProps } from 'types/auth'
import axios from 'axios'
import { Contract } from 'web3-eth-contract'
import { BrowserRouter as Router, Link } from 'react-router-dom'
// import { useSocket } from './hooks/useSocket'
// import parts from './flowbots'
import { useEffect, useState } from 'react'
import { getContract } from '../../utils'
import { AbiFragment } from 'web3'

const { VITE_APP_CDN_URL } = import.meta.env;

// CryptoKitties contracts:
// const { Egg: { abi, addr } } = Egg
// const egg: Contract<AbiFragment[]> = getContract(abi, addr)

const Geneva: React.FC<AuthProps> = ({ token, BASE_URL }) => {
    // const {
    //     block,
    // } = useSocket({ token });

    // useEffect(() => {
    //     console.log(block)
    // }, [block])

    return (
        <Router basename={BASE_URL.startsWith('./') ? '/' : BASE_URL}>
            <Styled.Main>
                <h1>barcode</h1>
                <img src={`${VITE_APP_CDN_URL}onGravity/barcode.png`} alt={'Barcode - Mandelbrot decoded'} />
                <h1>by kitty.international</h1>
            </Styled.Main>
        </Router>
    )
}

export default Geneva