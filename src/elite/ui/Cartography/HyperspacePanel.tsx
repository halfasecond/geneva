import React from 'react'
import { DASHBOARD, Z } from '../../config'
import OriginSelect from './OriginSelect'
import JumpBar from './JumpBar'
import type { CartographyRoute } from '../../render/cartographyMap'

interface HyperspacePanelProps {
  route: CartographyRoute
  fuel: number
  isHyperspacing: boolean
  onRouteChange: (route: CartographyRoute) => void
  onSetNearestOrigin: () => void
  onInitiateHyperspace: () => void
}

/**
 * Route + jump controls docked in the left cockpit column, below the scanner strip.
 * Sits above the cartography holo so the dashboard stays visible at all times.
 */
const HyperspacePanel: React.FC<HyperspacePanelProps> = ({
  route,
  fuel,
  isHyperspacing,
  onRouteChange,
  onSetNearestOrigin,
  onInitiateHyperspace,
}) => (
  <div
    style={{
      position: 'fixed',
      left: DASHBOARD.leftColumn.left,
      bottom: DASHBOARD.leftColumn.bottom,
      width: DASHBOARD.leftColumn.width,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      zIndex: Z.hyperspace,
      pointerEvents: 'auto',
    }}
  >
    <OriginSelect route={route} onRouteChange={onRouteChange} />
    <JumpBar
      route={route}
      fuel={fuel}
      isHyperspacing={isHyperspacing}
      onSetNearestOrigin={onSetNearestOrigin}
      onInitiateHyperspace={onInitiateHyperspace}
      layout="vertical"
    />
  </div>
)

export default HyperspacePanel