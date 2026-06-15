import React from 'react'
import { MAP } from '../../config'
import { CARTOGRAPHY_BODIES } from '../../sim/cartography'
import type { CartographyRoute } from '../../render/cartographyMap'

interface DestinationListProps {
  route: CartographyRoute
  onRouteChange: (route: CartographyRoute) => void
}

const ui = MAP.ui

const DestinationList: React.FC<DestinationListProps> = ({ route, onRouteChange }) => {
  const destinations = CARTOGRAPHY_BODIES
    .filter(b => b.type !== 'star')
    .sort((a, b) => a.name.localeCompare(b.name))

  const available = destinations.filter(b => b.id !== route.originId)

  return (
    <div style={{
      display: 'grid',
      gap: 5,
      padding: 8,
      width: 260,
      maxHeight: 'min(420px, 55vh)',
      overflowY: 'auto',
      border: `1px solid ${ui.listBorder}`,
      borderRadius: 5,
      background: ui.listBg,
      boxShadow: '0 0 24px rgba(102, 170, 255, 0.1)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      fontFamily: ui.font,
      color: ui.text,
      pointerEvents: 'auto',
    }}>
      {available.map(b => {
        const active = route.destinationId === b.id
        return (
          <button
            key={b.id}
            type="button"
            onClick={() => onRouteChange({ originId: route.originId, destinationId: b.id })}
            style={{
              minWidth: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              minHeight: 30,
              padding: '7px 10px',
              border: `1px solid ${ui.rowBorder}`,
              borderRadius: 5,
              color: active ? ui.activeColor : 'rgba(222, 234, 228, 0.82)',
              textAlign: 'left',
              background: active ? ui.activeBg : ui.rowBg,
              font: '850 11px/1 ui-monospace, monospace',
              cursor: 'pointer',
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {b.name}
            </span>
            <small style={{
              color: 'rgba(213, 227, 219, 0.62)',
              fontSize: 8,
              fontWeight: 850,
              textTransform: 'uppercase',
              flexShrink: 0,
            }}>
              {b.type}
            </small>
          </button>
        )
      })}
    </div>
  )
}

export default DestinationList