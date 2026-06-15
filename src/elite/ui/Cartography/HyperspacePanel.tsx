import React from 'react'
import { COLORS, DASHBOARD, Z } from '../../config'
import { getBodyById, getRouteJumpCost, getTravelDistanceFrom } from '../../sim/cartography'
import type { CartographyRoute } from '../../render/cartographyMap'

interface HyperspacePanelProps {
  route: CartographyRoute
  fromPos2d: { x: number; y: number }
  systemId: string
  fuel: number
  flightMode: string
  isHyperspacing: boolean
  onInitiateHyperspace: () => void
}

/** Destination intel + jump CTA — matches the left cockpit info card style. */
const HyperspacePanel: React.FC<HyperspacePanelProps> = ({
  route,
  fromPos2d,
  systemId,
  fuel,
  flightMode,
  isHyperspacing,
  onInitiateHyperspace,
}) => {
  const dest = getBodyById(route.destinationId, 'frozen')
  const cost = getRouteJumpCost(fromPos2d, systemId, route)
  const travel = getTravelDistanceFrom(fromPos2d, systemId, route.destinationId)
  const canJump = Boolean(dest) && !isHyperspacing && fuel >= cost

  return (
    <div
      style={{
        position: 'fixed',
        left: DASHBOARD.leftColumn.left,
        bottom: DASHBOARD.leftColumn.bottom,
        width: DASHBOARD.leftColumn.width,
        boxSizing: 'border-box',
        zIndex: Z.cockpitWidgets,
        pointerEvents: 'auto',
        ...DASHBOARD.leftPanel,
        color: COLORS.vechRingCss,
        fontFamily: 'ui-monospace, monospace',
        fontSize: '18px',
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
        {dest?.name || 'NO TARGET'}
      </div>
      <div style={{ marginBottom: '8px' }}>{travel?.label ?? '—'}</div>
      <div style={{ fontSize: '10px', marginBottom: '6px', opacity: 0.85 }}>
        {flightMode.toUpperCase()}
      </div>
      <div style={{ fontSize: '10px', marginBottom: '6px' }}>{dest?.government ?? '—'}</div>
      <div style={{ fontSize: '10px', marginBottom: '14px' }}>{dest?.sector ?? '—'}</div>

      <div style={{ fontSize: '10px', marginBottom: '12px', color: COLORS.textMuted }}>
        {cost} FUEL · {fuel} AVAILABLE
        {isHyperspacing && (
          <span style={{ color: '#ff6644', marginLeft: 8 }}>CHARGING</span>
        )}
      </div>

      <button
        type="button"
        disabled={!canJump}
        onClick={onInitiateHyperspace}
        style={{
          width: '100%',
          padding: '10px 12px',
          border: `1px solid ${isHyperspacing ? 'rgba(255, 102, 68, 0.45)' : 'rgba(0, 170, 255, 0.22)'}`,
          borderRadius: 2,
          background: isHyperspacing
            ? 'rgba(60, 20, 0, 0.45)'
            : canJump
              ? 'rgba(0, 6, 14, 0.9)'
              : 'rgba(0, 6, 14, 0.5)',
          color: canJump || isHyperspacing ? COLORS.vechRingCss : 'rgba(102, 170, 255, 0.35)',
          fontFamily: 'inherit',
          fontSize: '11px',
          fontWeight: 'bold',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          cursor: isHyperspacing ? 'wait' : canJump ? 'pointer' : 'not-allowed',
          boxShadow: canJump ? 'inset 0 0 12px rgba(102, 170, 255, 0.08)' : 'none',
        }}
      >
        {isHyperspacing ? 'JUMPING…' : 'INITIATE HYPERSPACE'}
      </button>
    </div>
  )
}

export default HyperspacePanel