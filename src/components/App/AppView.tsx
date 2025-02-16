import * as Styled from '../../style'
import { useState, useEffect } from 'react'
import Metamask from '../Metamask'
import { AuthProps } from '../../types/auth'
import { Paddock } from 'components/Paddock'
import IntroModal from 'components/IntroModal'

const AppView: React.FC<AuthProps> = ({ handleSignIn, handleSignOut, loggedIn: walletAddress, BASE_URL }) => {
    const [showIntro, setShowIntro] = useState(true);
    const [nfts, setNFTs] = useState<any[]>([]);

    // Load and analyze NFT data
    useEffect(() => {
        const loadNFTs = async () => {
            try {
                const response = await fetch('/api/chained-horse/nfts');
                const nfts = await response.json();
                setNFTs(nfts);

                // Log all NFTs
                console.log('\n=== All NFTs ===');
                console.log('Total NFTs:', nfts.length);

                // Analyze utilities
                const utilities = new Set(nfts.map((nft: any) => nft.utility).filter(Boolean));
                console.log('\nUnique utilities:', Array.from(utilities));

                // Count utilities
                const utilityCount: { [key: string]: number } = {};
                nfts.forEach((nft: any) => {
                    if (nft.utility) {
                        utilityCount[nft.utility] = (utilityCount[nft.utility] || 0) + 1;
                    }
                });
                console.log('\nUtility Distribution:');
                Object.entries(utilityCount).forEach(([utility, count]) => {
                    console.log(`${utility}: ${count} NFTs`);
                });
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
                {nfts.length > 0 && <Paddock horseId={21} modalOpen={showIntro} {...{ nfts }} />}
            </Styled.Main>
        </>
    )
}

export default AppView
