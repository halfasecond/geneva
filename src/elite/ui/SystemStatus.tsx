import React from 'react'
import { COLORS } from '../config'

const SystemStatus: React.FC = () => {
  const row1 = ['SYS', 'ENG']
  const row2 = ['RST', 'WEP']

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
      <div style={{ display: 'flex', gap: '6px' }}>
        {row1.map(sys => (
          <div key={sys} style={boxStyle}>
            {sys} 100%
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        {row2.map(sys => (
          <div key={sys} style={boxStyle}>
            {sys} 100%
          </div>
        ))}
      </div>
    </div>
  )
}

export default SystemStatus