import { useState } from 'react'
import * as Styled from './IntroModal.style'
import Metamask from '../Metamask'
import { getAssetPath } from '../../utils/assetPath';
import { useGameServer } from '../Paddock/hooks/useGameServer';

interface IntroModalProps {
    onSelectHorse: (horse: number) => void;  // Callback to select horse
    nfts: any;
    loggedIn: string | undefined;
    handleSignIn: () => void;
    handleSignOut: () => void;
    BASE_URL: string;
    currentHorse?: number;  // Current horse from socket
}

interface HorseSelectProps {
    nfts: Array<{ tokenId: number; svg: string }>;
    onSelect: (tokenId: number) => void;
}

const HorseSelect: React.FC<HorseSelectProps> = ({ nfts, onSelect }) => {
    return (
        <Styled.HorseGrid>
            {nfts.map(nft => (
                <Styled.HorseCard
                    key={nft.tokenId}
                    onClick={() => onSelect(nft.tokenId)}
                >
                    <img src={nft.svg} alt={`Horse #${nft.tokenId}`} />
                    <span>Horse #{nft.tokenId}</span>
                </Styled.HorseCard>
            ))}
        </Styled.HorseGrid>
    );
};

import { BACKGROUND_MUSIC } from '../../audio';

const IntroModal: React.FC<IntroModalProps> = ({
    onSelectHorse,
    handleSignIn,
    handleSignOut,
    BASE_URL,
    loggedIn,
    nfts,
    currentHorse
}) => {
    // Use socket passed from AppView
    const handleStart = () => {
        // Start playing music when entering paddock
        //BACKGROUND_MUSIC.play()
          //  .catch(error => console.error('Error playing audio:', error));
        // onStart();
    };

    // If we have a current horse, show it
    const selectedNft = currentHorse ? nfts.find(nft => nft.tokenId === currentHorse) : undefined;

    return (
        <Styled.Overlay>
            <Styled.ModalContent>
                <Styled.Avatar>
                    <img src={getAssetPath('horse/21.svg')} alt="Horse #21" />
                </Styled.Avatar>
                <Styled.Title>Welcome to The Paddock</Styled.Title>
                <p>Hello - I am <a href="https://opensea.io/assets/ethereum/0xf7503bea549e73c0f260e42c088568fd865a358a/21" target="_blank" rel="noopener noreferrer"><b>Chained Horse #21</b></a>, lead dev and CEO at the paddock.</p>
                <p>Get ready to explore the world of agentic A.I. horses!</p>

                {!loggedIn ? (
                    <>
                        <p>Connect your wallet to join the paddock!</p>
                    </>
                ) : nfts.filter(nft => nft.owner === loggedIn.toLowerCase()).length > 0 ? (
                    <>
                        {selectedNft ? (
                            <>
                                <p>Welcome back!</p>
                                <img src={selectedNft.svg} alt={`Horse #${selectedNft.tokenId}`} style={{ width: 200 }} />
                                <Styled.Button onClick={() => onSelectHorse(selectedNft.tokenId)}>
                                    Continue with Horse #{selectedNft.tokenId}?
                                </Styled.Button>
                            </>
                        ) : (
                            <>
                                <p>Select your horse to enter the paddock:</p>
                                <HorseSelect
                                    nfts={nfts.filter(nft => nft.owner === loggedIn.toLowerCase())}
                                    onSelect={(horse) => onSelectHorse(horse)}
                                />
                            </>
                        )}
                    </>
                ) : (
                    <Styled.MintCTA>
                        <h3>No Horses Yet?</h3>
                        <p>Mint your first Chained Horse to join the paddock!</p>
                        <a href="https://opensea.io/collection/chainedhorse" target="_blank" rel="noopener noreferrer">
                            <Styled.Button>Mint a Horse</Styled.Button>
                        </a>
                    </Styled.MintCTA>
                )}
                <Metamask {...{ handleSignIn, handleSignOut, BASE_URL }} loggedIn={loggedIn} />
            </Styled.ModalContent>
        </Styled.Overlay>
    );
};

export default IntroModal;