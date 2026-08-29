import * as Styled from './Connect.style'
import metamask from 'kittyInternational/svg/metamask.svg'
import { AuthProps } from 'kittyInternational/types/auth'

const Connect: React.FC<Pick<AuthProps, 'loggedIn' | 'handleSignIn' | 'handleSignOut'>> = ({
    loggedIn,
    handleSignIn,
    handleSignOut,
}) =>
  <Styled.Div>
    {loggedIn
      ? <button onClick={handleSignOut}><img src={metamask} alt="" />{'SIGN OUT'}</button>
      : <button onClick={handleSignIn}><img src={metamask} alt="" />{'SIGN IN'}</button>
    }
  </Styled.Div>

export default Connect
