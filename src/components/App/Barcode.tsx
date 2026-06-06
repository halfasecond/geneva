import Metamask from 'components/Metamask'
import { AuthProps } from 'types/auth'
import Barcode from '../Barcode'

import styled from 'styled-components'

const MetamaskContainer = styled.div`
    position: fixed;
    bottom: 20px;
    left: 20px;
    z-index: 1000;
`

const AppView: React.FC<AuthProps> = ({ 
    handleSignIn,
    handleSignOut,
    loggedIn: walletAddress,
    token,
    tokenId,
    BASE_URL
}) => {

    return (
        <>
            <MetamaskContainer>
                <Metamask {...{ handleSignIn, handleSignOut, token, tokenId, BASE_URL }} loggedIn={walletAddress} />
            </MetamaskContainer>
            <Barcode {...{ loggedIn: walletAddress, handleSignIn, handleSignOut, token, tokenId, BASE_URL }} />
        </>
    )
}

export default AppView
