import * as Styled from './Logo.style'
import logo from 'kittyInternational/svg/logo.svg'

const Logo = () =>
  <Styled.Header>
    <img src={logo} alt={'Kitty.International'} />
    <h1>{'Kitty.International'}</h1>
    <p className={'tag'}>{'Show me those wonderful kitties... 🐾'}</p>
  </Styled.Header>

export default Logo
