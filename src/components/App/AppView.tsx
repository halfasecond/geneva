import * as Styled from '../../style'
import { useState } from 'react'
import Metamask from '../Metamask'
import { AuthProps } from '../../types/auth'
import { Paddock } from 'components/Paddock'
import IntroModal from 'components/IntroModal'

const AppView: React.FC<AuthProps> = ({ handleSignIn, handleSignOut, loggedIn: walletAddress, BASE_URL }) => {
    const [showIntro, setShowIntro] = useState(true);

    const handleStart = () => {
        setShowIntro(false);
    };

    return (
        <>
            <Metamask {...{ handleSignIn, handleSignOut, BASE_URL }} loggedIn={walletAddress} />
            {showIntro && <IntroModal onStart={handleStart} />}
            <Styled.Main>
                <h1>The Paddock</h1>
                <Paddock horseId="21" modalOpen={showIntro} />
            </Styled.Main>
        </>
    )
}

export default AppView
