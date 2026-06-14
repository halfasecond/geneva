import React from 'react'
import { COLORS } from '../config'

interface StatusBarProps {
  hud: {
    speed: number
    fuel: number
  }
}

const StatusBar: React.FC<StatusBarProps> = ({ hud }) => {
  const speedPercent = Math.min(100, (hud.speed / 52) * 100)
  const fuelPercent = Math.min(100, ((hud.fuel || 0) / 120) * 100)

  const vechBlue = COLORS.vechRingCss
  const gaugeFill = '#ffaa00'  // keep classic holo fill; borders use vech blue to match your theme changes

  return (
    <div style={{
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: '260px',
      height: '48px',
      padding: '4px 8px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      background: 'rgba(0,0,0,0.3)',
      color: vechBlue,
      fontFamily: 'ui-monospace, monospace',
      fontSize: '8px',
      pointerEvents: 'auto',
    }}>
      {/* Horizontal speed gauge */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '55px' }}>
        <div>SPD</div>
        <div style={{
          width: '48px',
          height: '5px',
          background: 'rgba(255,170,0,0.1)',
          position: 'relative',
          marginTop: '1px',
          border: `1px solid ${vechBlue}`,
        }}>
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${speedPercent}%`,
            background: gaugeFill,
          }} />
        </div>
        <div style={{ fontSize: '6px', marginTop: '1px' }}>{hud.speed}</div>
      </div>

      {/* Fuel */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '42px' }}>
        <div>FUEL</div>
        <div style={{
          width: '24px',
          height: '5px',
          background: 'rgba(255,170,0,0.1)',
          position: 'relative',
          marginTop: '1px',
          border: `1px solid ${vechBlue}`,
        }}>
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${fuelPercent}%`,
            background: gaugeFill,
          }} />
        </div>
        <div style={{ fontSize: '6px', marginTop: '1px' }}>1.10/h</div>
      </div>

      {/* SYS, ENG, RST, WEP in 4 horizontal blocks */}
      <div style={{
        display: 'flex',
        gap: '4px',
        fontSize: '6px',
        marginLeft: '2px',
      }}>
        <div style={{
          textAlign: 'center',
          padding: '0px 2px',
          border: `1px solid ${vechBlue}`,
          background: 'rgba(0,0,0,0.2)',
          lineHeight: 1,
        }}>
          SYS<br />100%
        </div>
        <div style={{
          textAlign: 'center',
          padding: '0px 2px',
          border: `1px solid ${vechBlue}`,
          background: 'rgba(0,0,0,0.2)',
          lineHeight: 1,
        }}>
          ENG<br />100%
        </div>
        <div style={{
          textAlign: 'center',
          padding: '0px 2px',
          border: `1px solid ${vechBlue}`,
          background: 'rgba(0,0,0,0.2)',
          lineHeight: 1,
        }}>
          RST<br />100%
        </div>
        <div style={{
          textAlign: 'center',
          padding: '0px 2px',
          border: `1px solid ${vechBlue}`,
          background: 'rgba(0,0,0,0.2)',
          lineHeight: 1,
        }}>
          WEP<br />100%
        </div>
      </div>
    </div>
  )
}

export default StatusBar
