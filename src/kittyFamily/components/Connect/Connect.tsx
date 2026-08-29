// @ts-nocheck
import React from 'react'
import * as Styled from './Connect.style'
import metamaskSrc from 'kittyFamily/svg/metamask.svg'

const Connect = ({ loggedIn, handleSignIn, handleSignOut }) =>
  <Styled.Div>
    {loggedIn
      ? <button onClick={handleSignOut}><img src={metamaskSrc} alt="" />{'SIGN OUT'}</button>
      : <button onClick={handleSignIn}><img src={metamaskSrc} alt="" />{'SIGN IN'}</button>
    }
  </Styled.Div>

export default Connect
