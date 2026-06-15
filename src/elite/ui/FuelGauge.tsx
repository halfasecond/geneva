import React from 'react'
import { COLORS, FUEL } from '../config'

interface FuelGaugeProps {
  fuel: number
  barWidth?: number
}

const FuelGauge: React.FC<FuelGaugeProps> = ({ fuel, barWidth = 150 }) => {
  const percent = Math.min(100, ((fuel || 0) / FUEL.max) * 100)

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

export default FuelGauge