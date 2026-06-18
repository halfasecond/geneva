import React from 'react'
import { MAP, WINDSCREEN, Z } from '../../config'
import CartographyMap from './CartographyMap'
import DestinationList from './DestinationList'
import type { CartographyRoute } from '../../render/cartographyMap'

interface CartographyOverlayProps {
  route: CartographyRoute
  playerPos: { x: number; y: number }
  onRouteChange: (route: CartographyRoute) => void
}

/**
 * Cartography holo projected onto the cockpit windscreen.
 * Opaque map layer (no translucency) to avoid compositor flicker over the 3D canvas.
 */
const CartographyOverlay: React.FC<CartographyOverlayProps> = ({
  route,
  playerPos,
  onRouteChange,
}) => (
  <div
    style={{
      position: 'absolute',
      top: WINDSCREEN.top,
      left: WINDSCREEN.left,
      right: WINDSCREEN.right,
      bottom: WINDSCREEN.bottom,
      zIndex: Z.cartography,
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
      onDestinationPick={destinationId => onRouteChange({
        destinationId: route.destinationId === destinationId ? null : destinationId,
      })}
    />

    <div style={{
      position: 'absolute',
      top: 16,
      left: '50%',
      transform: 'translateX(-50%)',
      fontSize: 9,
      letterSpacing: 2,
      color: MAP.ui.muted,
      textTransform: 'uppercase',
      padding: '4px 14px',
      border: `1px solid ${MAP.ui.panelBorder}`,
      borderRadius: 3,
      background: MAP.ui.panelBg,
      fontFamily: MAP.ui.font,
      pointerEvents: 'none',
    }}>
      Cartography · Holo
    </div>

    <div style={{
      position: 'absolute',
      top: 16,
      right: 20,
      pointerEvents: 'none',
      fontFamily: MAP.ui.font,
      color: MAP.ui.text,
    }}>
      <DestinationList route={route} onRouteChange={onRouteChange} />
    </div>
  </div>
)

export default CartographyOverlay