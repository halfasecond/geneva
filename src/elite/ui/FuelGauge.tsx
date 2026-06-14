import React from 'react'

interface FuelGaugeProps {
  fuel: number
  barWidth?: number
}

const FuelGauge: React.FC<FuelGaugeProps> = ({ fuel, barWidth = 320 }) => {
  const vechBlue = '#66aaff'
  const gaugeFill = '#ffaa00'
  const maxFuel = 120
  const percent = Math.min(100, ((fuel || 0) / maxFuel) * 100)

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontSize: '8px',
      color: vechBlue,
      flex: 1
    }}>
      <div>FUEL</div>
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
      <div style={{ fontSize: '7px', marginTop: '1px' }}>1.10/h</div>
    </div>
  )
}

export default FuelGauge
