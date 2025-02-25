import { useEffect, useRef, useState } from 'react'
import * as Styled from './Clock.style'

interface ClockProps {
    block?: {
        blocknumber: number;
    };
    left: number;
    top: number;
}

const Clock: React.FC<ClockProps> = ({ block, left, top }) => {
    const [isSpinning, setIsSpinning] = useState(false);

    // Handle block changes
    useEffect(() => {
            // Trigger spin animation
            setIsSpinning(true);
            setTimeout(() => setIsSpinning(false), 500); // Match animation duration
    }, [block]);

    return (
        <Styled.Div id='clock' style={{ left, top }}>
            <Styled.TimerEmoji className={isSpinning ? 'spin' : ''}>
                ⏳
            </Styled.TimerEmoji>
            <p>{block && block.blocknumber}<br />block o'clock</p>
        </Styled.Div>
    )
}

export default Clock;
