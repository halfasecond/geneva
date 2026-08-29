import { useEffect, useMemo } from 'react'
import Portal from 'kittyFamily/components/Portal'
import * as Styled from './Confetti.style'

const COLORS = ['#EF52D1', '#AEF72F', '#FCDF35', '#45F0F4', '#4c7aef']

const Burst = () => {
    const specks = useMemo(() =>
        Array.from({ length: 32 }, (_, i) => {
            const angle = (i / 32) * Math.PI * 2
            const dist = 180 + (i % 5) * 80
            return {
                color: COLORS[i % COLORS.length],
                dx: `${Math.cos(angle) * dist}px`,
                dy: `${Math.sin(angle) * dist}px`,
                delay: `${(i % 8) * 40}ms`,
            }
        }), [])

    return (
        <Styled.Div>
            {specks.map((speck, i) => (
                <Styled.Speck key={i} $color={speck.color} $dx={speck.dx} $dy={speck.dy} $delay={speck.delay} />
            ))}
        </Styled.Div>
    )
}

const Confetti = ({ isMute = false, usePortal = false }: { isMute?: boolean; usePortal?: boolean }) => {
    useEffect(() => {
        if (isMute) return
        const meow = new Audio('/audios/like-button/LikeButton_15_Genesis.mp3')
        const t = window.setTimeout(() => {
            meow.currentTime = 0
            meow.play().catch(() => undefined)
        }, 600)
        return () => {
            window.clearTimeout(t)
            meow.pause()
        }
    }, [isMute])

    return usePortal ? <Portal><Burst /></Portal> : <Burst />
}

export default Confetti
