import * as Styled from '../../style'
import { useEffect, useState } from 'react'
import { BrowserRouter as Router, useLocation } from 'react-router-dom'
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
        <Router basename={BASE_URL}>
            <ScrollToTop />
            <Metamask {...{ handleSignIn, handleSignOut, BASE_URL }} loggedIn={walletAddress} />
            {showIntro && <IntroModal onStart={handleStart} />}
            <Styled.Main>
                <h1>The Paddock</h1>
                <Paddock horseId="21" modalOpen={showIntro} />
            </Styled.Main>
        </Router>
    )
}

const ScrollToTop: React.FC = () => {
    const { pathname } = useLocation()
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [pathname])
    return null
}

export default AppView
