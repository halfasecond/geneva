import * as Styled from '../../style'
import MetaMask from 'components/MetaMask'
import { useState, useEffect } from 'react'
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
                setNFTs(nfts)
            } catch (error) {
                console.error('Error loading NFTs:', error);
                setNFTs([]);
            }
        };
        loadNFTs();
    }, []);

    const [selectedHorse, setSelectedHorse] = useState<number | undefined>();

    const handleStart = (horse?: number) => {
        setSelectedHorse(horse);
        setShowIntro(false);
    };

    return (
        <>
            {showIntro && (
                <IntroModal
                    onStart={handleStart}
                    {...{ handleSignIn, handleSignOut, BASE_URL, loggedIn: walletAddress, nfts }}
                />
            )}
            <MetaMask {...{ handleSignIn, handleSignOut, BASE_URL }} loggedIn={walletAddress} />
            <Styled.Main>
                <h1>The Paddock</h1>
                <Paddock
                    tokenId={selectedHorse}
                    modalOpen={showIntro}
                    {...{ nfts, token }}
                />
            </Styled.Main>
        </>
    )
}

export default AppView
