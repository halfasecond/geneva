import React from 'react'
import { COLORS } from '../config'

interface SpeedGaugeProps {
  speed: number
  barWidth?: number
}

const SpeedGauge: React.FC<SpeedGaugeProps> = ({ speed, barWidth = 150 }) => {
  const maxSpeed = 52
  const percent = Math.min(100, (speed / maxSpeed) * 100)

  return (
    <div style={{
      width: barWidth,
      height: '8px',
      background: 'rgba(0,0,0,0.3)',
      border: `1px solid ${COLORS.vechRingCss}`,
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        height: '100%',
        width: `${percent}%`,
        background: '#ffaa00',
      }} />
    </div>
  )
}

export default SpeedGauge