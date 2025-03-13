import { useEffect, useRef, useState } from 'react'
import * as Styled from './Clock.style'
import { CLOCK_DIMENSIONS } from './constants'

interface ClockProps {
    block?: {
        blocknumber: number;
    };
    left?: number;
    top?: number;
}

const Clock: React.FC<ClockProps> = ({ 
    block, 
    left = CLOCK_DIMENSIONS.left, 
    top = CLOCK_DIMENSIONS.top 
}) => {
    const prevBlock = useRef(block?.blocknumber);
    const [isSpinning, setIsSpinning] = useState(false);
    const [showVitalik, setShowVitalik] = useState(false);

    // Handle block changes
    useEffect(() => {
        if (block?.blocknumber !== prevBlock.current) {
            // Trigger animations
            setIsSpinning(true);
            setShowVitalik(true);
            
            // Reset animations
            const timer = setTimeout(() => {
                setIsSpinning(false);
                setShowVitalik(false);
            }, 500);
            
            prevBlock.current = block?.blocknumber;
            return () => clearTimeout(timer);
        }
    }, [block?.blocknumber]);

    return (
        <Styled.Div 
            id='clock' 
            style={{ 
                left, 
                top,
                width: CLOCK_DIMENSIONS.width,
                height: CLOCK_DIMENSIONS.height
            }}
        >
            <Styled.TimerEmoji className={isSpinning ? 'spin' : ''}>
                ⏳
            </Styled.TimerEmoji>
            <p>🐎 {block && block.blocknumber} 🐎<br />block o'clock</p>
            
            {/* Vitalik Flash */}
            <Styled.VitalikFlash 
                show={showVitalik}
                className={showVitalik ? 'flash' : ''}
            >
                <img 
                    src="/vitalik.png" 
                    alt="Vitalik Buterin"
                />
            </Styled.VitalikFlash>
        </Styled.Div>
    )
}

export default Clock;
