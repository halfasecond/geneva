import React from 'react'
import { MAP, WINDSCREEN } from '../../config'
import CartographyMap from './CartographyMap'
import OriginSelect from './OriginSelect'
import DestinationList from './DestinationList'
import JumpBar from './JumpBar'
import type { CartographyRoute } from '../../render/cartographyMap'

interface CartographyOverlayProps {
  route: CartographyRoute
  fuel: number
  playerPos: { x: number; y: number; z: number }
  isHyperspacing: boolean
  onRouteChange: (route: CartographyRoute) => void
  onSetNearestOrigin: () => void
  onInitiateHyperspace: () => void
  onClose: () => void
}

/**
 * Cartography holo projected onto the cockpit windscreen.
 * Opaque map layer (no translucency) to avoid compositor flicker over the 3D canvas.
 */
const CartographyOverlay: React.FC<CartographyOverlayProps> = ({
  route,
  fuel,
  playerPos,
  isHyperspacing,
  onRouteChange,
  onSetNearestOrigin,
  onInitiateHyperspace,
  onClose,
}) => (
  <div
    style={{
      position: 'absolute',
      top: WINDSCREEN.top,
      left: WINDSCREEN.left,
      right: WINDSCREEN.right,
      bottom: WINDSCREEN.bottom,
      zIndex: 9,
      overflow: 'hidden',
      pointerEvents: 'auto',
      border: `1px solid ${WINDSCREEN.border}`,
      boxShadow: WINDSCREEN.innerGlow,
      background: MAP.windscreenBg,
    }}
    role="dialog"
    aria-label="Cartography holo"
  >
    <CartographyMap
      route={route}
      playerPos={{ x: playerPos.x, y: playerPos.y }}
      onDestinationPick={id => onRouteChange({ ...route, destinationId: id })}
    />

    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'grid',
      gridTemplateColumns: 'minmax(200px, 240px) 1fr minmax(200px, 260px)',
      gridTemplateRows: 'auto 1fr auto',
      padding: '16px 20px',
      gap: 16,
      pointerEvents: 'none',
      fontFamily: MAP.ui.font,
      color: MAP.ui.text,
    }}>
      <div style={{ gridColumn: 1, gridRow: 1, alignSelf: 'start' }}>
        <OriginSelect route={route} onRouteChange={onRouteChange} />
      </div>

      <div style={{
        gridColumn: 2,
        gridRow: 1,
        justifySelf: 'center',
        alignSelf: 'start',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        pointerEvents: 'none',
      }}>
        <div style={{
          fontSize: 9,
          letterSpacing: 2,
          color: MAP.ui.muted,
          textTransform: 'uppercase',
          padding: '4px 14px',
          border: `1px solid ${MAP.ui.panelBorder}`,
          borderRadius: 3,
          background: MAP.ui.panelBg,
        }}>
          Cartography · Holo
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: '4px 12px',
            border: `1px solid ${MAP.ui.panelBorder}`,
            borderRadius: 3,
            background: MAP.ui.panelBg,
            color: MAP.ui.muted,
            font: '9px/1 ui-monospace, monospace',
            letterSpacing: 1,
            cursor: 'pointer',
            pointerEvents: 'auto',
            textTransform: 'uppercase',
          }}
        >
          M — Dismiss
        </button>
      </div>

      <div style={{ gridColumn: 3, gridRow: '1 / 3', alignSelf: 'start', justifySelf: 'end' }}>
        <DestinationList route={route} onRouteChange={onRouteChange} />
      </div>

      <div style={{
        gridColumn: '1 / -1',
        gridRow: 3,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'end',
        paddingBottom: 4,
      }}>
        <JumpBar
          route={route}
          fuel={fuel}
          isHyperspacing={isHyperspacing}
          onSetNearestOrigin={onSetNearestOrigin}
          onInitiateHyperspace={onInitiateHyperspace}
        />
      </div>
    </div>
  </div>
)

export default CartographyOverlay