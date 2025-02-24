import { useState, useEffect } from 'react'
import * as Styled from '../../style'
import Metamask from 'components/Metamask'
import IntroModal from 'components/IntroModal'
import Game from 'components/Game'
import { useWeb3 } from '../../contexts/Web3Context'

const { BASE_URL } = import.meta.env;

const AppView = () => {
    const { isConnected, address, token, tokenId, connect, disconnect } = useWeb3();
    const [nfts, setNFTs] = useState<any[]>([]);
    const [selectedHorse, setSelectedHorse] = useState<number | undefined>(tokenId ?? undefined);

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

    // Update selected horse when tokenId changes
    useEffect(() => {
        setSelectedHorse(tokenId ?? undefined);
    }, [tokenId]);

    const metamaskProps = {
        handleSignIn: connect,
        handleSignOut: disconnect,
        token: token ?? undefined,
        tokenId: tokenId ?? undefined,
        BASE_URL,
        loggedIn: address ?? undefined
    };

    const introModalProps = {
        onSelectHorse: (id: number) => setSelectedHorse(id),
        handleSignIn: connect,
        handleSignOut: disconnect,
        BASE_URL,
        loggedIn: address ?? undefined,
        nfts,
        currentHorse: tokenId ?? undefined
    };

    const gameProps = {
        tokenId: selectedHorse === -1 ? undefined : selectedHorse,
        nfts,
        token: token ?? undefined
    };

    return (
        <>
            {(!selectedHorse || selectedHorse < 0 || !isConnected) && (
                <IntroModal {...introModalProps} />
            )}
            <Metamask {...metamaskProps} />
            <Styled.Main>
                <h1>The Paddock</h1>
                {nfts.length > 0 && <Game {...gameProps} />}
            </Styled.Main>
        </>
    )
}

export default AppView
