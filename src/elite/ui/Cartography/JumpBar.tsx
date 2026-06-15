import React from 'react'
import { MAP } from '../../config'
import { getBodyById, getJumpFuelCost } from '../../sim/cartography'
import type { CartographyRoute } from '../../render/cartographyMap'

interface JumpBarProps {
  route: CartographyRoute
  fuel: number
  isHyperspacing: boolean
  onSetNearestOrigin: () => void
  onInitiateHyperspace: () => void
}

const ui = MAP.ui

const JumpBar: React.FC<JumpBarProps> = ({
  route,
  fuel,
  isHyperspacing,
  onSetNearestOrigin,
  onInitiateHyperspace,
}) => {
  const origin = getBodyById(route.originId, 0)
  const dest = getBodyById(route.destinationId, 0)
  const cost = getJumpFuelCost(
    origin?.pos2d || { x: 0, y: 0 },
    dest?.pos2d || { x: 0, y: 0 },
  )

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 16px',
      border: `1px solid ${ui.panelBorder}`,
      borderRadius: 7,
      background: ui.panelBg,
      boxShadow: '0 0 28px rgba(102, 170, 255, 0.14)',
      fontFamily: ui.font,
      color: ui.text,
      pointerEvents: 'auto',
    }}>
      <div style={{ fontSize: 11, minWidth: 180 }}>
        <div style={{ color: ui.muted, fontSize: 9, marginBottom: 2 }}>ROUTE</div>
        <div>
          {origin?.name} → <span style={{ color: MAP.highlightDest }}>{dest?.name || '—'}</span>
        </div>
        <div style={{ color: MAP.playerColor, fontSize: 10, marginTop: 2 }}>
          {cost} FUEL · {fuel} AVAILABLE
        </div>
        {isHyperspacing && (
          <div style={{ color: '#ff6644', fontSize: 10, marginTop: 2 }}>CHARGING</div>
        )}
      </div>

      <button
        type="button"
        onClick={onSetNearestOrigin}
        style={btnStyle(false)}
      >
        NEAREST ORIGIN
      </button>

      <button
        type="button"
        disabled={isHyperspacing || fuel < cost}
        onClick={onInitiateHyperspace}
        style={{
          ...btnStyle(isHyperspacing),
          background: isHyperspacing ? 'rgba(60, 20, 0, 0.5)' : 'rgba(102, 170, 255, 0.18)',
          border: `1px solid ${isHyperspacing ? '#ff6644' : 'rgba(102, 170, 255, 0.45)'}`,
          opacity: fuel < cost ? 0.45 : 1,
        }}
      >
        {isHyperspacing ? 'JUMPING…' : 'INITIATE HYPERSPACE'}
      </button>
    </div>
  )
}

function btnStyle(dim: boolean): React.CSSProperties {
  return {
    padding: '7px 12px',
    border: `1px solid ${ui.rowBorder}`,
    borderRadius: 5,
    background: dim ? 'rgba(22, 39, 56, 0.5)' : ui.rowBg,
    color: 'rgba(222, 234, 228, 0.9)',
    font: '850 10px/1 ui-monospace, monospace',
    cursor: dim ? 'wait' : 'pointer',
    whiteSpace: 'nowrap',
  }
}

export default JumpBar