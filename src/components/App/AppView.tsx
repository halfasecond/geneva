import * as Styled from '../../style'
import MetaMask from 'components/MetaMask'
import { useState, useEffect } from 'react'
import { AuthProps } from '../../types/auth'
import { Paddock } from 'components/Paddock'
import IntroModal from 'components/IntroModal'

const AppView: React.FC<AuthProps> = ({ handleSignIn, handleSignOut, loggedIn: walletAddress, token, tokenId, BASE_URL }) => {
    const [nfts, setNFTs] = useState<any[]>([]);
    const [selectedHorse, setSelectedHorse] = useState<number | undefined>(tokenId);

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

    return (
        <>
            {(!selectedHorse || !walletAddress) &&  (
                <IntroModal
                    onSelectHorse={id => setSelectedHorse(id)}
                    {...{ handleSignIn, handleSignOut, BASE_URL, loggedIn: walletAddress, nfts }}
                />
            )}
            <MetaMask {...{ handleSignIn, handleSignOut, BASE_URL }} loggedIn={walletAddress} />
            <Styled.Main>
                <h1>The Paddock</h1>
                {selectedHorse ? (
                    <Paddock
                        tokenId={selectedHorse}
                        {...{ nfts, token }}
                    />
                ) : (
                    <p>{selectedHorse}</p>
                )}
            </Styled.Main>
        </>
    )
}

export default AppView
