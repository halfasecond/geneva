import React from 'react'
import { COLORS, WINDSCREEN, Z } from '../config'

export interface PositionDebugProps {
  pos: { x: number; y: number; z: number }
  speed: number
  flightMode: string
  borealDist: number | null
  borealDelta: { x: number; y: number; z: number } | null
}

const PositionDebug: React.FC<PositionDebugProps> = ({
  pos,
  speed,
  flightMode,
  borealDist,
  borealDelta,
}) => {
  const sideHint = borealDelta
    ? Math.abs(borealDelta.x) >= Math.abs(borealDelta.z)
      ? borealDelta.x > 0
        ? 'starboard'
        : 'port'
      : borealDelta.z > 0
        ? 'aft'
        : 'fore'
    : null

  const line = (label: string, value: string) => (
    <div key={label} style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
      <span style={{ opacity: 0.65 }}>{label}</span>
      <span>{value}</span>
    </div>
  )

  return (
    <div
      style={{
        position: 'fixed',
        top: WINDSCREEN.top + 6,
        left: WINDSCREEN.left + 8,
        zIndex: Z.cockpitWidgets,
        pointerEvents: 'none',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 10,
        lineHeight: 1.45,
        color: COLORS.vechRingCss,
        background: 'rgba(0, 6, 14, 0.72)',
        border: `1px solid ${COLORS.vechRingCss}44`,
        padding: '6px 8px',
        minWidth: 148,
      }}
    >
      <div style={{ fontSize: 9, opacity: 0.55, marginBottom: 4, letterSpacing: '0.06em' }}>
        SHIP POS
      </div>
      {line('x', String(pos.x))}
      {line('y', String(pos.y))}
      {line('z', String(pos.z))}
      {line('spd', String(speed))}
      {line('mode', flightMode)}
      {borealDist !== null && line('boreal', `${borealDist}m`)}
      {borealDelta && line('Δ', `${borealDelta.x}, ${borealDelta.y}, ${borealDelta.z}`)}
      {sideHint && line('side', sideHint)}
    </div>
  )
}

export default PositionDebug