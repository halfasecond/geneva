import AppView from '../Flowbots/components/App/AppView'
import { AuthProps } from '../../types/auth'

const _AppView: React.FC<AuthProps> = ({ 
    handleSignIn,
    handleSignOut,
    loggedIn,
    token,
    BASE_URL
}) => {
    console.log(BASE_URL)
    return (
        <AppView {...{ handleSignIn, handleSignOut, loggedIn, token, BASE_URL }} />
    )
}

export default _AppView