// @ts-nocheck
import { useEffect, useState } from 'react'
import * as Styled from './Message.style'

const Message = ({ loggedIn, socket, user }) => {
  const [message, setMessage] = useState('')
  return (
    <Styled.Div>
      <input type={'text'} disabled={!loggedIn || !user.balance} value={message} onChange={e => {
        if (e.target.value.length <= 140) {
          setMessage(e.target.value)
        }
      }} />
      <button disabled={message === '' || (!loggedIn || !user.balance)} onClick={() => {
        socket.emit('addMessage', { account: loggedIn, message })
        setMessage('')
      }}>{'Send'}</button>
    </Styled.Div>
  )
}

export default Message
