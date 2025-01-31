import * as Styled from '../../style'
import { useEffect, useState } from 'react'
import { BrowserRouter as Router, useLocation } from 'react-router-dom'
import Metamask from '../Metamask'
import { AuthProps } from '../../types/auth'
import { Paddock } from 'components/Paddock'
// import { Ollama } from 'ollama'

const AppView: React.FC<AuthProps> = ({ handleSignIn, handleSignOut, loggedIn: walletAddress, BASE_URL }) => {
    // const [messages, setMessages] = useState<string[]>([])

    // Ollama chat - commented out for now
    /*
    useEffect(() => {
        const ollama = new Ollama()
        
        const chat = async () => {
            const response = await ollama.chat({
                model: 'llama2',
                messages: [{ role: 'user', content: 'Why hello there!' }],
            })
            
            setMessages(prev => [...prev, response.message.content])
        }
        
        chat()
    }, [])
    */

    return (
        <Router basename={BASE_URL}>
            <ScrollToTop />
            <Metamask {...{ handleSignIn, handleSignOut, BASE_URL }} loggedIn={walletAddress} />
            <Styled.Main>
                <h1>The Paddock</h1>
                <Paddock horseId={21} />
                {/* Ollama messages
                <div>
                    {messages.map((msg, i) => (
                        <p key={i}>{msg}</p>
                    ))}
                </div>
                */}
            </Styled.Main>
        </Router>
    )
}

const ScrollToTop: React.FC = () => {
    const { pathname } = useLocation()
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [pathname])
    return null
}

export default AppView
