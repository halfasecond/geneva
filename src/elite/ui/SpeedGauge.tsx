import React from 'react'

interface SpeedGaugeProps {
  speed: number
  barWidth?: number
}

const SpeedGauge: React.FC<SpeedGaugeProps> = ({ speed, barWidth = 320 }) => {
  const vechBlue = '#66aaff'
  const gaugeFill = '#ffaa00'
  const maxSpeed = 52
  const percent = Math.min(100, (speed / maxSpeed) * 100)

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontSize: '8px',
      color: vechBlue,
      flex: 1
    }}>
      <div>SPD</div>
      <div style={{
        width: barWidth,
        height: '8px',
        background: 'rgba(0,0,0,0.3)',
        border: `1px solid ${vechBlue}`,
        position: 'relative',
        marginTop: '2px'
      }}>
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: `${percent}%`,
          background: gaugeFill,
        }} />
      </div>
      <div style={{ fontSize: '7px', marginTop: '1px' }}>{speed}</div>
    </div>
  )
}

export default SpeedGauge
