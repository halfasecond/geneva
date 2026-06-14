import React from 'react'

const SystemStatus: React.FC = () => {
  const vechBlue = '#66aaff'
  const systems = ['SYS', 'ENG', 'RST', 'WEP']

  return (
    <div style={{
      display: 'flex',
      gap: '6px',
      fontSize: '7px',
      color: vechBlue,
      width: '100%'
    }}>
      {systems.map(sys => (
        <div key={sys} style={{
          textAlign: 'center',
          padding: '2px 4px',
          border: `1px solid ${vechBlue}`,
          background: 'rgba(0,0,0,0.2)',
          lineHeight: 1,
          flex: 1,
          minWidth: 0
        }}>
          {sys}<br />100%
        </div>
      ))}
    </div>
  )
}

export default SystemStatus
