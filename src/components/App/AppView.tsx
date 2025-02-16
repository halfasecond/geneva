import * as Styled from '../../style'
import styled from 'styled-components'

const LoginMessage = styled.div`
    text-align: center;
    padding: 2rem;
    font-size: 1.2rem;
    color: #666;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin: 2rem auto;
    max-width: 400px;
`
import { useState, useEffect } from 'react'
import Metamask from '../Metamask'
import { AuthProps } from '../../types/auth'
import { Paddock } from 'components/Paddock'
import IntroModal from 'components/IntroModal'

const AppView: React.FC<AuthProps> = ({ handleSignIn, handleSignOut, loggedIn: walletAddress, token, BASE_URL }) => {
    const [showIntro, setShowIntro] = useState(true);
    const [nfts, setNFTs] = useState<any[]>([]);

    // Load and analyze NFT data
    useEffect(() => {
        const loadNFTs = async () => {
            try {
                const response = await fetch('/api/chained-horse/nfts');
                const nfts = await response.json();
                setNFTs(nfts);
            } catch (error) {
                console.error('Error loading NFTs:', error);
            }
        };

        loadNFTs();
    }, []); // Load once on mount

    const handleStart = () => {
        setShowIntro(false);
    };

    return (
        <>
            <Metamask {...{ handleSignIn, handleSignOut, BASE_URL }} loggedIn={walletAddress} />
            {showIntro && <IntroModal onStart={handleStart} />}
            <Styled.Main>
                <h1>The Paddock</h1>
                {token ? (
                    nfts.length > 0 && <Paddock tokenId={21} modalOpen={showIntro} token={token} {...{ nfts }} />
                ) : (
                    <LoginMessage>
                        Please connect your wallet using the Metamask button above to enter the paddock
                    </LoginMessage>
                )}
            </Styled.Main>
        </>
    )
}

export default AppView
