import React from 'react';
import * as Styled from './IntroModal.style';
import { getAssetPath } from '../../utils/assetPath';

interface IntroModalProps {
    onStart: () => void;
}

import { BACKGROUND_MUSIC } from '../../audio';

const IntroModal: React.FC<IntroModalProps> = ({ onStart }) => {
    const handleStart = () => {
        // Start playing music when entering paddock
        BACKGROUND_MUSIC.play()
            .catch(error => console.error('Error playing audio:', error));
        onStart();
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
                <p style={{ marginBottom: '20px' }}>Click below to begin your journey with music.</p>
                <Styled.Button onClick={handleStart}>
                    Enter The Paddock
                </Styled.Button>
            </Styled.ModalContent>
        </Styled.Overlay>
    );
};

export default IntroModal;