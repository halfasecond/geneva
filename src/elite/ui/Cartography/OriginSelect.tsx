import React from 'react'
import { MAP } from '../../config'
import { CARTOGRAPHY_BODIES } from '../../sim/cartography'
import type { CartographyRoute } from '../../render/cartographyMap'

interface OriginSelectProps {
  route: CartographyRoute
  onRouteChange: (route: CartographyRoute) => void
}

const ui = MAP.ui

const OriginSelect: React.FC<OriginSelectProps> = ({ route, onRouteChange }) => {
  const destinations = CARTOGRAPHY_BODIES
    .filter(b => b.type !== 'star')
    .sort((a, b) => a.name.localeCompare(b.name))

  const changeOrigin = (originId: string) => {
    const nextDest = destinations.find(b => b.id !== originId)
    if (!nextDest) return
    onRouteChange({ originId, destinationId: nextDest.id })
  }

  return (
    <label style={{
      display: 'grid',
      gridTemplateColumns: 'auto minmax(0, 1fr)',
      alignItems: 'center',
      gap: 10,
      padding: '8px 10px',
      border: `1px solid ${ui.panelBorder}`,
      borderRadius: 7,
      background: ui.panelBg,
      boxShadow: '0 0 20px rgba(102, 170, 255, 0.12)',
      fontFamily: ui.font,
      pointerEvents: 'auto',
    }}>
      <span style={{
        color: ui.muted,
        fontSize: 9,
        fontWeight: 850,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      }}>
        Origin
      </span>
      <select
        value={route.originId}
        onChange={e => changeOrigin(e.currentTarget.value)}
        style={{
          appearance: 'none',
          minWidth: 0,
          height: 28,
          border: '1px solid rgba(229, 236, 224, 0.12)',
          borderRadius: 5,
          color: 'rgba(255, 255, 255, 0.9)',
          background: 'rgba(18, 32, 46, 0.54)',
          font: '850 12px/1 ui-monospace, monospace',
          padding: '0 14px 0 10px',
        }}
      >
        {destinations.map(b => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>
    </label>
  )
}

export default OriginSelect