// @ts-nocheck
import chat from 'kittyFamily/svg/chat.svg'
import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import * as Styled from './Menu.style'
import mysterySrc from 'kittyFamily/svg/mystery.svg'
import hatSrc from 'kittyFamily/svg/hat.svg'
import bagSrc from 'kittyFamily/svg/market.svg'

const Menu = ({ handleClick, total, loggedIn, catsWithHats/* , socket */ }) => {
  // const [report, setReport] = useState(undefined)

  // useEffect(() => {
  //     if (socket) {
  //         socket.on("progress", (report) => {
  //           setReport(report)
  //         })
  //     }
  // },[socket])
  const navigate = useNavigate()
  const getRandomNumber = max => Math.floor(Math.random() * max) + 1
  return (
    <Styled.Div>
      <div onClick={handleClick}>
        <img src={chat} alt={'Kitty Chatrooms'} />
      </div>
      <div>
        <img src={mysterySrc} alt="" onClick={() => total ? navigate(`/kitty/${getRandomNumber(total)}`) : navigate(`/kitty/${getRandomNumber(2023514)}`)} />
      </div>
      <div><Link to={'/kitty-hats'}><img src={'/images/kitty-hats/logo.png'} alt={''} /></Link></div>
      {/* <div>
        <img src={hatSrc} alt="" onClick={() => catsWithHats.length && navigate(`/kitty/${catsWithHats[getRandomNumber(catsWithHats.length - 1)]}`)} />
      </div>
        */}
      <div><Link to={'/search'}><img src={bagSrc} alt="" /></Link></div>
      <div><Link to={'/audit'}>Audit</Link></div>
      <div><Link to={'/report'}>Report</Link></div>
    </Styled.Div>
  )
}



export default Menu
