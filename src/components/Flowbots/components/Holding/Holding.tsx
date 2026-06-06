import Countdown from '../Countdown'
import * as Styled from './Holding.style'

const { VITE_APP_CLUE } = import.meta.env

interface Props {
    countdown: number;
}

const Intro: React.FC<Props> = ({ countdown }) => {
    return (
        <Styled.Div>
            <h1>Flowbots</h1>
            <p>by <a href={'https://kitty.international'} target={'_blank'}>kitty.international</a></p>
            <Styled.Grid>
                <div>
                    <img src={'/flowbots.gif'} />
                </div>
            </Styled.Grid>
            {countdown && (
                <>
                    <blockquote>
                        <p>{VITE_APP_CLUE}</p>
                    </blockquote>
                    <h3>Factory opening:</h3>
                    <Countdown {...{ countdown }} />
                </>
            )}
        </Styled.Div>
    )
}

export default Intro

