import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Countdown from '../Countdown'
import Floor from '../Floor'
import { Counts as CountsType } from '../Counts/count.types'
import * as Styled from './Intro.style'

const { VITE_APP_CLUE } = import.meta.env

interface Props {
    activeAuction?: number
    init: (from: string) => Promise<void>
    handleSignIn: () => void
    endAuction: (from: string) => Promise<void>
    counts?: CountsType
    loggedIn?: string
    countdown: number
}

const Intro: React.FC<Props> = ({ activeAuction, counts, init, handleSignIn, endAuction, loggedIn, countdown }) => {
    const [loading, setLoading] = useState(false)
    const [values, setValues] = useState<Record<string, string>>({
        value0: '',
        value1: '',
        value2: '',
        value3: '',
    })
    const [locked, setLocked] = useState(true)

    const handleEndAuction = async (from: string) => {
        setLoading(true)
        try {
            await endAuction(from)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const { value0, value1, value2, value3 } = values
        if (value0 === '8' && value1 === '8' && value2 === '8' && value3 === '8' && locked) {
            setLocked(false)
        }
    }, [values, locked])

    const handleInputChange = (index: number, value: string) => {
        setValues(prevState => ({
            ...prevState,
            [`value${index}`]: value,
        }))
    }

    const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        loggedIn ? init(loggedIn) : handleSignIn()
    }

    return (
        <Styled.Div>
            <h1>Flowbots</h1>
            <p>by <a href="https://kitty.international" target="_blank" rel="noopener noreferrer">kitty.international</a></p>
            {activeAuction === 0 ? (
                <>
                    <img src="/flowbots.png" alt="Flowbots" />
                    <h2>Factory</h2>
                    <p>The factory is currently closed but you can find a way to open it?</p>
                    <blockquote>The note said {VITE_APP_CLUE}</blockquote>
                    <Styled.Form onSubmit={handleFormSubmit}>
                        <div>
                            {Array.from({ length: 4 }, (_, i) => (
                                <input
                                    key={i}
                                    type="number"
                                    value={values[`value${i}`]}
                                    onChange={e => handleInputChange(i, e.target.value)}
                                />
                            ))}
                        </div>
                        <input type="submit" disabled={locked} value="🤖 Unlock Factory 🤖" />
                    </Styled.Form>
                </>
            ) : (
                activeAuction !== undefined && (
                    <>
                        <h2>Factory Auction:</h2>
                        <Styled.Grid>
                            <Link to={`/flowbot/${activeAuction}`}>
                                {/* Uncomment and use Bot component if needed */}
                                {/* <Bot bot={makeBot(activeAuction - 1)} lines={true} /> */}
                            </Link>
                        </Styled.Grid>
                        {countdown > 0 ? (
                            <>
                                <blockquote>
                                    Bids are now being accepted on <Link to={`/flowbot/${activeAuction}`}>Flowbot #{activeAuction}</Link>
                                </blockquote>
                                <h3>Bidding closes:</h3>
                                <Countdown countdown={countdown} />
                            </>
                        ) : (
                            <>
                                <blockquote>
                                    Bids have now closed on <Link to={`/flowbot/${activeAuction}`}>Flowbot #{activeAuction}</Link>
                                </blockquote>
                                <Styled.Button
                                    onClick={() => (loggedIn ? handleEndAuction(loggedIn) : handleSignIn())}
                                    disabled={loading}
                                >
                                    🤖 click here to start the next auction 🤖
                                </Styled.Button>
                            </>
                        )}
                        <h2 className="flowbots-floor">Flowbots Floor:</h2>
                        <Floor counts={counts} activeAuction={activeAuction} loggedIn={loggedIn} />
                    </>
                )
            )}
        </Styled.Div>
    )
}

export default Intro
