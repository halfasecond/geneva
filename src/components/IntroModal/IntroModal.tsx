import { useState } from 'react'
import * as Styled from './IntroModal.style'
import Metamask from '../Metamask'
import { getAssetPath } from '../../utils/assetPath';

interface IntroModalProps {
    onStart: (selectedHorse?: number) => void;
    nfts: Array<{ tokenId: number; svg: string }>;
    loggedIn: string | undefined;
    handleSignIn: () => void;
    handleSignOut: () => void;
    BASE_URL: string;
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
    onStart,
    handleSignIn,
    handleSignOut,
    BASE_URL,
    loggedIn,
    nfts
}) => {
    const [selectedHorse, setSelectedHorse] = useState<number | undefined>();
    const handleStart = () => {
        // Start playing music when entering paddock
        BACKGROUND_MUSIC.play()
            .catch(error => console.error('Error playing audio:', error));
        onStart(selectedHorse);
    };

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
                        <Metamask {...{ handleSignIn, handleSignOut, BASE_URL, loggedIn }} />
                    </>
                ) : nfts.filter(nft => nft.owner === loggedIn.toLowerCase()).length > 0 ? (
                    <>
                        <p>Select your horse to enter the paddock:</p>
                        <HorseSelect nfts={nfts.filter(nft => nft.owner === loggedIn.toLowerCase())} onSelect={setSelectedHorse} />
                        <Styled.Button
                            onClick={handleStart}
                            disabled={!selectedHorse}
                        >
                            {selectedHorse
                                ? `Enter with Horse #${selectedHorse}`
                                : 'Select a Horse'
                            }
                        </Styled.Button>
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
            </Styled.ModalContent>
        </Styled.Overlay>
    );
};

export default IntroModal;