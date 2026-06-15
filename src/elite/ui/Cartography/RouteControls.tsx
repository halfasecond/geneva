import React from 'react'
import { COLORS, MAP } from '../../config'
import {
  CARTOGRAPHY_BODIES,
  getBodyById,
  getJumpFuelCost,
} from '../../sim/cartography'
import type { CartographyRoute } from '../../render/cartographyMap'

interface RouteControlsProps {
  route: CartographyRoute
  fuel: number
  isHyperspacing: boolean
  onRouteChange: (route: CartographyRoute) => void
  onSetNearestOrigin: () => void
  onInitiateHyperspace: () => void
}

const panelStyle: React.CSSProperties = {
  border: `1px solid rgba(102, 170, 255, 0.2)`,
  borderRadius: 5,
  background: 'rgba(0, 8, 18, 0.45)',
  backdropFilter: 'blur(6px)',
}

const RouteControls: React.FC<RouteControlsProps> = ({
  route,
  fuel,
  isHyperspacing,
  onRouteChange,
  onSetNearestOrigin,
  onInitiateHyperspace,
}) => {
  const destinations = CARTOGRAPHY_BODIES
    .filter(b => b.type !== 'star')
    .sort((a, b) => a.name.localeCompare(b.name))

  const origin = destinations.find(b => b.id === route.originId) ?? destinations[0]
  const availableDestinations = destinations.filter(b => b.id !== origin?.id)
  const destination = availableDestinations.find(b => b.id === route.destinationId) ?? availableDestinations[0]

  const originBody = getBodyById(route.originId, 0)
  const destBody = getBodyById(route.destinationId, 0)
  const jumpCost = getJumpFuelCost(
    originBody?.pos2d || { x: 0, y: 0 },
    destBody?.pos2d || { x: 0, y: 0 },
  )

  const changeOrigin = (originId: string) => {
    const nextDest = destinations.find(b => b.id !== originId)
    if (!nextDest) return
    onRouteChange({ originId, destinationId: nextDest.id })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Origin select — Flocker pattern, vech palette */}
      <label style={{
        ...panelStyle,
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        alignItems: 'center',
        gap: 10,
        padding: '8px 10px',
        fontSize: 9,
        color: COLORS.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
      }}>
        <span>Origin</span>
        <select
          value={origin?.id}
          onChange={e => changeOrigin(e.currentTarget.value)}
          style={{
            appearance: 'none',
            height: 28,
            border: `1px solid rgba(102, 170, 255, 0.25)`,
            borderRadius: 4,
            color: '#e8f4ff',
            background: 'rgba(4, 12, 22, 0.7)',
            font: '12px/1 ui-monospace, monospace',
            padding: '0 10px',
          }}
        >
          {destinations.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </label>

      {/* Destination list */}
      <div style={{ ...panelStyle, padding: 8, display: 'grid', gap: 5 }}>
        <div style={{ fontSize: 9, color: COLORS.textMuted, letterSpacing: 0.8, marginBottom: 2 }}>
          DESTINATION
        </div>
        {availableDestinations.map(b => {
          const active = destination?.id === b.id
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onRouteChange({ originId: origin!.id, destinationId: b.id })}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                minHeight: 30,
                padding: '7px 10px',
                border: `1px solid ${active ? COLORS.vechRingCss : 'rgba(102, 170, 255, 0.15)'}`,
                borderRadius: 4,
                color: active ? '#fff' : COLORS.vechRingCss,
                background: active ? 'rgba(102, 170, 255, 0.18)' : 'rgba(4, 12, 22, 0.5)',
                font: '11px/1 ui-monospace, monospace',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span>{b.name}</span>
              <small style={{ fontSize: 8, opacity: 0.65, textTransform: 'uppercase' }}>{b.type}</small>
            </button>
          )
        })}
      </div>

      {/* Route summary */}
      <div style={{ ...panelStyle, padding: '8px 10px', fontSize: 10 }}>
        <div style={{ opacity: 0.55, fontSize: 9, marginBottom: 4 }}>ROUTE</div>
        <div>FROM <span style={{ color: MAP.highlightOrigin }}>{originBody?.name}</span></div>
        <div>TO <span style={{ color: MAP.highlightDest }}>{destBody?.name}</span></div>
        <div style={{ marginTop: 4, color: MAP.playerColor, fontSize: 11 }}>
          COST: {jumpCost} FUEL
        </div>
      </div>

      <button
        type="button"
        onClick={onSetNearestOrigin}
        style={{
          width: '100%',
          padding: '5px 8px',
          background: 'rgba(4, 12, 22, 0.6)',
          border: `1px solid rgba(102, 170, 255, 0.3)`,
          borderRadius: 4,
          color: COLORS.vechRingCss,
          fontSize: 9,
          cursor: 'pointer',
        }}
      >
        SET NEAREST AS ORIGIN
      </button>

      <button
        type="button"
        disabled={isHyperspacing || fuel < jumpCost}
        onClick={onInitiateHyperspace}
        style={{
          width: '100%',
          padding: '6px 8px',
          background: isHyperspacing ? 'rgba(40, 12, 0, 0.5)' : 'rgba(0, 40, 60, 0.6)',
          border: `1px solid ${isHyperspacing ? '#ff6644' : 'rgba(102, 170, 255, 0.5)'}`,
          borderRadius: 4,
          color: '#e8f4ff',
          fontSize: 10,
          cursor: isHyperspacing ? 'wait' : 'pointer',
          opacity: fuel < jumpCost ? 0.45 : 1,
        }}
      >
        {isHyperspacing ? 'HYPERSPACE IN PROGRESS...' : 'INITIATE HYPERSPACE'}
      </button>
    </div>
  )
}

export default RouteControls