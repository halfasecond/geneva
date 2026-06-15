import React from 'react'
import type { WaypointIndicator } from '../sim/waypoints'
import { WAYPOINTS, WINDSCREEN, Z } from '../config'

interface WaypointOverlayProps {
  waypoints: WaypointIndicator[]
  hidden?: boolean
}

function formatWaypointDist(metres: number): string {
  if (metres >= 1000) return `${(metres / 1000).toFixed(1)}k`
  return `${Math.round(metres)}`
}

const WaypointStar: React.FC<{ wp: WaypointIndicator }> = ({ wp }) => {
  const isSun = wp.type === 'star'
  const accent = isSun
    ? '#ffe6a3'
    : wp.isDestination
      ? '#fff0a8'
      : '#d8f0ff'
  const size = wp.isDestination ? 8 : isSun ? 7 : 5
  const opacity = 1
  const glow = isSun
    ? `drop-shadow(0 0 5px #ffe6a3) drop-shadow(0 0 10px rgba(255, 200, 80, 0.9))`
    : wp.isDestination
      ? `drop-shadow(0 0 4px ${accent}) drop-shadow(0 0 8px rgba(255, 240, 160, 0.85))`
      : `drop-shadow(0 0 3px #ffffff) drop-shadow(0 0 6px rgba(180, 220, 255, 0.75))`

  return (
    <div
      style={{
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        opacity,
      }}
    >
      <svg
        width={size * 2}
        height={size * 2}
        viewBox="-12 -12 24 24"
        style={{ filter: glow, overflow: 'visible' }}
        aria-hidden
      >
        {isSun ? (
          <>
            <circle r="9" fill="none" stroke={accent} strokeWidth="1.4" opacity={0.55} />
            <circle r="6.2" fill={accent} />
            <circle r="3.2" fill="#fff8e8" opacity={0.95} />
          </>
        ) : (
          <>
            <path
              d="M0,-10 L2.6,-2.6 L10,0 L2.6,2.6 L0,10 L-2.6,2.6 L-10,0 L-2.6,-2.6 Z"
              fill={accent}
            />
            <circle r="2.2" fill="#ffffff" opacity={0.95} />
          </>
        )}
      </svg>
      <span
        style={{
          fontSize: 7,
          letterSpacing: '0.12em',
          color: accent,
          textShadow: `0 0 4px ${accent}`,
          fontWeight: 600,
          lineHeight: 1.1,
        }}
      >
        {wp.label}
      </span>
      <span
        style={{
          fontSize: 5,
          letterSpacing: '0.08em',
          color: accent,
          opacity: 0.75,
          textShadow: `0 0 3px ${accent}`,
          lineHeight: 1,
        }}
      >
        {formatWaypointDist(wp.distLocal)}
      </span>
    </div>
  )
}

/** Planet waypoint stars — positions updated each sim frame from Elite.tsx state. */
const WaypointOverlay: React.FC<WaypointOverlayProps> = ({
  waypoints,
  hidden = false,
}) => {
  if (hidden || waypoints.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: WINDSCREEN.top,
        left: WINDSCREEN.left,
        right: WINDSCREEN.right,
        bottom: WINDSCREEN.bottom,
        zIndex: Z.cockpitWidgets - 1,
        pointerEvents: 'none',
        overflow: 'hidden',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      }}
    >
      {WAYPOINTS.debugHardcoded && (
        <div
          style={{
            position: 'absolute',
            top: 6,
            left: 8,
            fontSize: 9,
            letterSpacing: '0.1em',
            color: '#ffaa66',
            opacity: 0.85,
          }}
        >
          DBG WAYPOINT
        </div>
      )}
      {waypoints.map(wp => (
        <div
          key={wp.id}
          style={{
            position: 'absolute',
            left: `${wp.screenX * 100}%`,
            top: `${wp.screenY * 100}%`,
          }}
        >
          <WaypointStar wp={wp} />
        </div>
      ))}
    </div>
  )
}

export default WaypointOverlay