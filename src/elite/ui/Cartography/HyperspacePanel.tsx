import React from 'react'
import { COLORS, DASHBOARD, Z } from '../../config'
import {
  STAR_SYSTEMS,
  canInitiateHyperspace,
  getBodyById,
  getRouteJumpCost,
  getTravelDistanceFrom,
} from '../../sim/cartography'
import type { CartographyRoute } from '../../render/cartographyMap'

interface HyperspacePanelProps {
  route: CartographyRoute
  fromPos2d: { x: number; y: number }
  systemId: string
  dockedAtStationId: string | null
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
  dockedAtStationId,
  fuel,
  flightMode,
  isHyperspacing,
  onInitiateHyperspace,
}) => {
  const dest = getBodyById(route.destinationId, 'frozen')
  const hasTarget = Boolean(dest)
  const cost = getRouteJumpCost(fromPos2d, systemId, route)
  const travel = getTravelDistanceFrom(fromPos2d, systemId, route.destinationId)
  const insufficientFuel = hasTarget && Number.isFinite(cost) && fuel < cost
  const canJump = canInitiateHyperspace({
    destinationId: route.destinationId,
    flightMode,
    fuel,
    cost,
    isHyperspacing,
  })

  const currentSystem = STAR_SYSTEMS[systemId]
  const targetSystem = dest ? STAR_SYSTEMS[dest.systemId] : null
  const headline = hasTarget
    ? (targetSystem?.name ?? dest!.systemId)
    : (currentSystem?.name ?? systemId)

  const dockedBody = dockedAtStationId ? getBodyById(dockedAtStationId, 'frozen') : null
  const subline = hasTarget
    ? (travel?.label ?? '—')
    : flightMode === 'docked'
      ? (dockedBody?.name ?? '—')
      : 'In flight'
  const isInFlight = !hasTarget && flightMode !== 'docked'

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
        border: hasTarget
          ? `1px solid ${COLORS.vechRingCss}`
          : DASHBOARD.leftPanel.border,
        boxShadow: hasTarget ? '0 0 18px rgba(102, 170, 255, 0.22)' : 'none',
        color: COLORS.vechRingCss,
        fontFamily: 'ui-monospace, monospace',
        fontSize: '18px',
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
        {headline}
      </div>
      <div style={{
        marginBottom: isInFlight ? '14px' : '8px',
        fontSize: isInFlight ? '10px' : undefined,
      }}>
        {subline}
      </div>

      {hasTarget && dest && (
        <>
          <div style={{ fontSize: '10px', marginBottom: '6px' }}>{dest.name}</div>
          <div style={{ fontSize: '10px', marginBottom: '14px' }}>{dest.sector ?? '—'}</div>
          <div style={{ fontSize: '10px', marginBottom: '12px', color: COLORS.textMuted }}>
            {Number.isFinite(cost) ? `${cost} FUEL` : '—'} ·{' '}
            <span style={{ color: insufficientFuel ? '#ff6644' : COLORS.textMuted }}>
              {fuel} AVAILABLE
            </span>
            {isHyperspacing && (
              <span style={{ color: '#ff6644', marginLeft: 8 }}>CHARGING</span>
            )}
          </div>
        </>
      )}

      {!hasTarget && dockedBody?.sector && (
        <div style={{ fontSize: '10px', marginBottom: '14px', color: COLORS.textMuted }}>
          {dockedBody.sector}
        </div>
      )}

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