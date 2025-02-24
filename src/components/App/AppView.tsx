import { useState, useEffect } from 'react'
import * as Styled from '../../style'
import Metamask from 'components/Metamask'
import { AuthProps } from '../../types/auth'
import IntroModal from 'components/IntroModal'
import Game from 'components/Game'

const AppView: React.FC<AuthProps> = ({ 
    handleSignIn,
    handleSignOut,
    loggedIn: walletAddress,
    token,
    tokenId,
    BASE_URL
}) => {
    const [nfts, setNFTs] = useState<any[]>([]);
    const [selectedHorse, setSelectedHorse] = useState<number | undefined>(tokenId);

    // Load and analyze NFT data
    useEffect(() => {
        const loadNFTs = async () => {
            try {
                const response = await fetch('/chained-horse/nfts');
                const nfts = await response.json();
                setNFTs(nfts)
            } catch (error) {
                console.error('Error loading NFTs:', error);
                setNFTs([]);
            }
        };
        loadNFTs();
    }, [])

    return (
        <>
            {(!selectedHorse || selectedHorse < 0 || !walletAddress) &&  (
                <IntroModal
                    onSelectHorse={id => setSelectedHorse(id)}
                    {...{ handleSignIn, handleSignOut, BASE_URL, loggedIn: walletAddress, nfts }}
                    currentHorse={tokenId}
                />
            )}
            <Metamask {...{ handleSignIn, handleSignOut, token, tokenId, BASE_URL }} loggedIn={walletAddress} />
            <Styled.Main>
                <h1>The Paddock</h1>
                {nfts.length && (
                    <Game 
                        tokenId={selectedHorse === - 1 ? undefined : selectedHorse}
                        {...{ nfts, token }}
                    />
                )}
            </Styled.Main>
        </>
    )
}

export default AppView
