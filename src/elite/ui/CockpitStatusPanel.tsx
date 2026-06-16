import React from 'react'
import { COLORS, DASHBOARD } from '../config'
import { getBodyById } from '../sim/cartography'
import type { TravelDistance } from '../sim/cartography'

interface CockpitStatusPanelProps {
  flightMode: string
  dockedAtStationId: string | null
  destinationId: string
  travelDistance: TravelDistance | null
  credits: number
  cargoUsed: number
  nearestDock: { id: string; name: string; dist: number } | null
}

/** Left cockpit info card — destination when flying, docked station when at port. */
const CockpitStatusPanel: React.FC<CockpitStatusPanelProps> = ({
  flightMode,
  dockedAtStationId,
  destinationId,
  travelDistance,
  credits,
  cargoUsed,
  nearestDock,
}) => {
  const isDocked = flightMode === 'docked'
  const dockedBody = dockedAtStationId ? getBodyById(dockedAtStationId, 'frozen') : null
  const destBody = getBodyById(destinationId, 'frozen')
  const focusBody = isDocked ? dockedBody : destBody

  return (
    <div style={{
      position: 'absolute',
      left: DASHBOARD.leftColumn.left,
      bottom: DASHBOARD.leftColumn.bottom,
      width: DASHBOARD.leftColumn.width,
      boxSizing: 'border-box',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      ...DASHBOARD.leftPanel,
      color: COLORS.vechRingCss,
      fontFamily: 'ui-monospace, monospace',
      fontSize: '18px',
      pointerEvents: 'none',
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
        {focusBody?.name ?? (isDocked ? 'UNKNOWN PORT' : 'NO TARGET')}
      </div>

      <div style={{ marginBottom: '8px', fontSize: isDocked ? '14px' : '18px' }}>
        {isDocked
          ? (focusBody?.sector ?? '—')
          : (travelDistance?.label ?? '—')}
      </div>

      <div style={{
        fontSize: '10px',
        marginBottom: '6px',
        opacity: 0.85,
        color: isDocked ? '#88ffcc' : undefined,
      }}>
        {flightMode.toUpperCase()}
      </div>

      <div style={{ fontSize: '10px', marginBottom: '4px' }}>
        {credits.toLocaleString()} cr · {cargoUsed}t cargo
      </div>

      {isDocked ? (
        <div style={{ fontSize: '9px', marginBottom: '6px', opacity: 0.75 }}>
          [↑↓] services · [↵] select · [F] undock
        </div>
      ) : nearestDock ? (
        <div style={{ fontSize: '9px', marginBottom: '6px', opacity: 0.7 }}>
          {nearestDock.id === 'boreal-station'
            ? `fly into field · [F] dock (${nearestDock.dist}m)`
            : `[F] dock ${nearestDock.name}`}
        </div>
      ) : null}

      <div style={{ fontSize: '10px', marginBottom: isDocked ? 0 : '6px' }}>
        {focusBody?.government ?? '—'}
      </div>
      {!isDocked && (
        <div style={{ fontSize: '10px' }}>{focusBody?.sector ?? '—'}</div>
      )}

      {isDocked && destBody && destBody.id !== dockedAtStationId && (
        <div style={{
          fontSize: '9px',
          marginTop: '10px',
          paddingTop: '8px',
          borderTop: '1px solid rgba(102, 170, 255, 0.15)',
          opacity: 0.7,
          lineHeight: 1.45,
        }}>
          Route → {destBody.name}
          <br />
          {travelDistance?.label ?? '—'}
        </div>
      )}
    </div>
  )
}

export default CockpitStatusPanel