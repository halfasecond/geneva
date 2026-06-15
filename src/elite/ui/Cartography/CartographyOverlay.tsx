import React from 'react'
import { PANELS } from '../../config'
import HoloPanel from '../HoloPanel/HoloPanel'
import CartographyMap from './CartographyMap'
import RouteControls from './RouteControls'
import JumpStatus from './JumpStatus'
import type { CartographyRoute } from '../../render/cartographyMap'

interface CartographyOverlayProps {
  route: CartographyRoute
  fuel: number
  playerPos: { x: number; y: number; z: number }
  isHyperspacing: boolean
  mapPanelPos: { x: number; y: number }
  controlsPanelPos: { x: number; y: number }
  onRouteChange: (route: CartographyRoute) => void
  onSetNearestOrigin: () => void
  onInitiateHyperspace: () => void
  onStartMapDrag: (e: React.MouseEvent) => void
  onStartControlsDrag: (e: React.MouseEvent) => void
  onClose: () => void
}

const CartographyOverlay: React.FC<CartographyOverlayProps> = ({
  route,
  fuel,
  playerPos,
  isHyperspacing,
  mapPanelPos,
  controlsPanelPos,
  onRouteChange,
  onSetNearestOrigin,
  onInitiateHyperspace,
  onStartMapDrag,
  onStartControlsDrag,
  onClose,
}) => (
  <>
    <HoloPanel
      title="CARTOGRAPHY • HOLO • LIVE ORBITAL DATA"
      pos={mapPanelPos}
      onStartDrag={onStartMapDrag}
      onClose={onClose}
      footer="CLICK MAP OR SELECT DESTINATION • ORBITS LIVE"
    >
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <CartographyMap
          route={route}
          playerPos={{ x: playerPos.x, y: playerPos.y }}
          onDestinationPick={id => onRouteChange({ ...route, destinationId: id })}
        />
      </div>
    </HoloPanel>

    <HoloPanel
      title="ROUTE • HOLO • JUMP CONTROL"
      pos={controlsPanelPos}
      width={PANELS.width}
      onStartDrag={onStartControlsDrag}
      footer="DRAG HEADER • VECH CARTOGRAPHY"
    >
      <RouteControls
        route={route}
        fuel={fuel}
        isHyperspacing={isHyperspacing}
        onRouteChange={onRouteChange}
        onSetNearestOrigin={onSetNearestOrigin}
        onInitiateHyperspace={onInitiateHyperspace}
      />
    </HoloPanel>

    <JumpStatus route={route} isHyperspacing={isHyperspacing} />
  </>
)

export default CartographyOverlay