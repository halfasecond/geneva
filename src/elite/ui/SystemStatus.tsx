import React from 'react'
import { COLORS, FUEL } from '../config'

interface SystemStatusProps {
  fuel: number
  flightMode: string
}

function pct(n: number) {
  return `${Math.round(Math.max(0, Math.min(100, n)))}%`
}

const SystemStatus: React.FC<SystemStatusProps> = ({ fuel, flightMode }) => {
  const fuelPct = (fuel / FUEL.max) * 100
  const eng = fuelPct
  const sys = flightMode === 'docked' ? 100 : fuelPct < 15 ? fuelPct * 4 : 100
  const rst = flightMode === 'hyperspace' ? 72 : 100
  const wep = flightMode === 'docked' ? 0 : 100

  const rows: [string, number][][] = [
    [['SYS', sys], ['ENG', eng]],
    [['RST', rst], ['WEP', wep]],
  ]

  const boxStyle = {
    textAlign: 'center' as const,
    padding: '2px 4px',
    border: `1px solid ${COLORS.vechRingCss}`,
    background: 'rgba(0,0,0,0.2)',
    lineHeight: 1.1,
    flex: 1,
    minWidth: 0,
    fontSize: '12px',
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      fontSize: '12px',
      color: COLORS.vechRingCss,
      width: '100%',
    }}>
      {rows.map((row, i) => (
        <div key={i} style={{ display: 'flex', gap: '6px' }}>
          {row.map(([label, value]) => (
            <div key={label} style={boxStyle}>
              {label} {pct(value)}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default SystemStatus