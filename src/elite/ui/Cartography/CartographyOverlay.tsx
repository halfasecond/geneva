import React from 'react'
import { MAP } from '../../config'
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
 * Full-screen play-blocking cartography mode.
 * Flocker-style: map fills the windscreen, origin left, destinations right, jump bar bottom.
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
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      pointerEvents: 'auto',
    }}
    role="dialog"
    aria-label="Cartography"
  >
    <CartographyMap
      route={route}
      playerPos={{ x: playerPos.x, y: playerPos.y }}
      onDestinationPick={id => onRouteChange({ ...route, destinationId: id })}
    />

    {/* Floating chrome — no HoloPanel boxes */}
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'grid',
      gridTemplateColumns: '280px 1fr 280px',
      gridTemplateRows: 'auto 1fr auto',
      padding: '28px',
      gap: 24,
      pointerEvents: 'none',
      fontFamily: MAP.ui.font,
      color: MAP.ui.text,
    }}>
      <div style={{ gridColumn: 1, gridRow: 1, alignSelf: 'start' }}>
        <OriginSelect route={route} onRouteChange={onRouteChange} />
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
        paddingBottom: 8,
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

    <button
      type="button"
      onClick={onClose}
      style={{
        position: 'absolute',
        top: 28,
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '6px 12px',
        border: `1px solid ${MAP.ui.listBorder}`,
        borderRadius: 5,
        background: MAP.ui.panelBg,
        backdropFilter: 'blur(10px)',
        color: MAP.ui.muted,
        font: '850 9px/1 ui-monospace, monospace',
        letterSpacing: 0.8,
        cursor: 'pointer',
        pointerEvents: 'auto',
        textTransform: 'uppercase',
      }}
    >
      M — Close
    </button>
  </div>
)

export default CartographyOverlay