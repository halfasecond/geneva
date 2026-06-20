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
  mapOpen: boolean
  mapToggleDisabled?: boolean
  onToggleMap: () => void
  onInitiateHyperspace: () => void
}

const MAP_TOGGLE_SIZE = 32

const MAP_TOGGLE_ICON_SIZE = 24

/** Cartography affordance — two orbits, sun, and planets in cockpit blue. */
function MapToggleIcon({ color = COLORS.vechRingCss }: { color?: string }) {
  const cx = 7
  const cy = 7
  const orbit = (radius: number) => (
    <circle
      key={`orbit-${radius}`}
      cx={cx}
      cy={cy}
      r={radius}
      fill="none"
      stroke={color}
      strokeWidth="0.42"
      opacity={0.82}
    />
  )
  const planet = (orbitRadius: number, degrees: number, size = 0.58) => {
    const rad = (degrees * Math.PI) / 180
    return (
      <circle
        key={`planet-${orbitRadius}-${degrees}`}
        cx={cx + orbitRadius * Math.cos(rad)}
        cy={cy + orbitRadius * Math.sin(rad)}
        r={size}
        fill={color}
      />
    )
  }

  return (
    <svg
      width={MAP_TOGGLE_ICON_SIZE}
      height={MAP_TOGGLE_ICON_SIZE}
      viewBox="0 0 14 14"
      aria-hidden
      style={{ display: 'block' }}
    >
      {orbit(2.65)}
      {orbit(4.55)}
      <circle cx={cx} cy={cy} r={1.2} fill={color} opacity={0.18} />
      <circle cx={cx} cy={cy} r={0.82} fill={color} />
      {planet(2.65, -52, 0.52)}
      {planet(4.55, 128, 0.56)}
      {planet(4.55, -168, 0.46)}
    </svg>
  )
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
  mapOpen,
  mapToggleDisabled = false,
  onToggleMap,
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

  const mapToggleActive = mapOpen && !mapToggleDisabled

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
      <button
        type="button"
        tabIndex={-1}
        aria-label={mapOpen ? 'Close cartography map' : 'Open cartography map'}
        aria-pressed={mapOpen}
        disabled={mapToggleDisabled}
        onMouseDown={(e) => e.preventDefault()}
        onKeyDown={(e) => e.preventDefault()}
        onClick={onToggleMap}
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          width: MAP_TOGGLE_SIZE,
          height: MAP_TOGGLE_SIZE,
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: mapToggleActive
            ? `1px solid ${COLORS.vechRingCss}`
            : '1px solid rgba(0, 170, 255, 0.22)',
          borderRadius: 2,
          background: mapToggleActive
            ? 'rgba(102, 170, 255, 0.18)'
            : 'rgba(0, 6, 14, 0.9)',
          color: mapToggleDisabled ? 'rgba(102, 170, 255, 0.35)' : COLORS.vechRingCss,
          cursor: mapToggleDisabled ? 'not-allowed' : 'pointer',
          boxShadow: mapToggleActive ? 'inset 0 0 10px rgba(102, 170, 255, 0.12)' : 'none',
          outline: 'none',
        }}
      >
        <MapToggleIcon
          color={mapToggleDisabled ? 'rgba(102, 170, 255, 0.35)' : COLORS.vechRingCss}
        />
      </button>

      <div style={{ fontWeight: 'bold', marginBottom: '4px', paddingRight: MAP_TOGGLE_SIZE + 8 }}>
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