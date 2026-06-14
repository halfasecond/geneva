import React from 'react'

const SystemStatus: React.FC = () => {
  const vechBlue = '#66aaff'
  const row1 = ['SYS', 'ENG']
  const row2 = ['RST', 'WEP']

  const boxStyle = {
    textAlign: 'center',
    padding: '2px 4px',  // added 2px vertical padding as requested; font size kept at 12px (50% larger)
    border: `1px solid ${vechBlue}`,
    background: 'rgba(0,0,0,0.2)',
    lineHeight: 1.1,
    flex: 1,
    minWidth: 0,
    fontSize: '12px'  // 50% larger (from 8px)
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      fontSize: '12px',
      color: vechBlue,
      width: '100%'
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
