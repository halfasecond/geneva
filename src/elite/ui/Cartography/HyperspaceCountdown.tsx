import React from 'react'
import { WINDSCREEN, Z } from '../../config'

interface HyperspaceCountdownProps {
  count: number
}

const HyperspaceCountdown: React.FC<HyperspaceCountdownProps> = ({ count }) => (
  <div
    style={{
      position: 'fixed',
      top: `calc((${WINDSCREEN.top}px + 100vh - ${WINDSCREEN.bottom}px) / 2)`,
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: Z.logo,
      pointerEvents: 'none',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSize: 96,
      fontWeight: 700,
      lineHeight: 1,
      color: '#ff6644',
      textShadow: '0 0 32px rgba(255, 102, 68, 0.65), 0 0 8px rgba(255, 170, 0, 0.4)',
      letterSpacing: 4,
    }}
    aria-live="assertive"
  >
    {count}
  </div>
)

export default HyperspaceCountdown