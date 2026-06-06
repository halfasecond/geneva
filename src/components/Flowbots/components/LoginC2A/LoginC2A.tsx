import * as fcl from '@onflow/fcl'
import * as Styled from './LoginC2A.style'

const LoginC2A: React.FC<{ user: any }> = ({ user }) => {
    return user.loggedIn ? (
        <Styled.Button onClick={fcl.unauthenticate}>
            <img src={'/flow.svg'} alt={''} />
            Log Out
        </Styled.Button>
    ) : (
        <Styled.Button onClick={fcl.authenticate}>
            <img src={'/flow.svg'} alt={''} />
            Log In
        </Styled.Button>
    )
}

export default LoginC2A