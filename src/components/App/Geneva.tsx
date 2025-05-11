import Metamask from 'components/Metamask'
import { AuthProps } from 'types/auth'
import Geneva from '../Geneva'

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
            <Metamask {...{ handleSignIn, handleSignOut, token, tokenId, BASE_URL }} loggedIn={walletAddress} />
            <Geneva {...{ BASE_URL }} />
        </>
    )
}

export default AppView
