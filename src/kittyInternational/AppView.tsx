import { useState } from 'react'
import Web3 from 'web3'
import Connect from 'kittyInternational/components/Connect'
import Logo from 'kittyInternational/components/Logo'
import Home from 'kittyInternational/pages/Home'
import CryptoKittiesContract from 'kittyInternational/contracts/cryptokitties'
import { AuthProps } from 'kittyInternational/types/auth'
import * as S from './App.style'

const AppView: React.FC<AuthProps> = ({ loggedIn, handleSignIn, handleSignOut }) => {
    const [readMore, setReadMore] = useState(false)

    const handlePurchase = async (tokenId: number, value: string, sale: boolean) => {
        try {
            if (!loggedIn) {
                handleSignIn()
                return false
            }
            const web3 = new Web3(window.ethereum)
            const instance = sale
                ? new web3.eth.Contract(CryptoKittiesContract.Sale.abi, CryptoKittiesContract.Sale.addr)
                : new web3.eth.Contract(CryptoKittiesContract.Sire.abi, CryptoKittiesContract.Sire.addr)
            await instance.methods.bid(tokenId).send({ from: loggedIn, value })
            return true
        } catch (e) {
            console.log(e)
            return false
        }
    }

    return (
        <S.Div>
            <Logo />
            <S.Section>
                <p>
                    Hello! I am the proud owner of @500 Cryptokitties, 3 Chained Horses and a 2 bit bear{' '}
                    <span onClick={() => setReadMore(!readMore)}>read more..</span>
                </p>
                {readMore && (
                    <>
                        <p>I started collecting Cryptokitties in 2017 and have been interested in blockchain / web3 dev ever since.</p>
                        <p>
                            <a href={'https://kitty.family'} target={'_blank'} rel="noreferrer">kitty.family</a>
                            {' '}and{' '}
                            <a href={'https://kitty.news'} target={'_blank'} rel="noreferrer">kitty.news</a>
                            {' '}were launched in 2018, and in 2021 I was hired by DapperLabs to work on the actual{' '}
                            <a href={'https://cryptokitties.co'} target={'_blank'} rel="noreferrer">CryptoKitties website!</a>
                        </p>
                        <p>
                            In 2022 I fell in love with{' '}
                            <a href={'https://twitter.com/moonfarm_eth'} target={'_blank'} rel="noreferrer">@moonfarmeth's</a>
                            {' '}project ChainedHorses and made{' '}
                            <a href={'https://paddock.chainedhorse.com'} target={'_blank'} rel="noreferrer">The Paddock</a>
                            {' '}— a place where horse owners can meet and chat.
                        </p>
                        <p>But this is the site where it all started for me... Through 2023 Kitty.International will be evolving into a marketplace for OGs.</p>
                        <p>But for now here is my collection - every kitty tells a story... </p>
                    </>
                )}
            </S.Section>
            <Home {...{ handlePurchase }} />
            <Connect {...{ loggedIn, handleSignIn, handleSignOut }} />
        </S.Div>
    )
}

export default AppView
