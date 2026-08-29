// @ts-nocheck
import React from 'react'
import { Link } from 'react-router-dom'
import * as Styled from './Logo.style'
import logo from 'kittyFamily/svg/logo.svg'

const Logo = () => {
  return (
    <Styled.Div larger={(window.location.pathname === '/')}>
      <img src={logo} alt={'Kitty.Family'} />
      <h1><Link to="/">Kitty.Family</Link></h1>
      <h2>by <a href="https://kitty.international" target="_blank" rel="noreferrer">Kitty.International</a></h2>
    </Styled.Div>
  )
}

export default Logo
