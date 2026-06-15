import React from 'react'
import { DASHBOARD, Z } from '../../config'
import JumpBar from './JumpBar'
import type { CartographyRoute } from '../../render/cartographyMap'

interface HyperspacePanelProps {
  route: CartographyRoute
  fuel: number
  isHyperspacing: boolean
  onSetNearestOrigin: () => void
  onInitiateHyperspace: () => void
}

/** Route + jump controls in the left cockpit column, above the cartography holo. */
const HyperspacePanel: React.FC<HyperspacePanelProps> = ({
  route,
  fuel,
  isHyperspacing,
  onSetNearestOrigin,
  onInitiateHyperspace,
}) => (
  <div
    style={{
      position: 'fixed',
      left: DASHBOARD.leftColumn.left,
      bottom: DASHBOARD.leftColumn.bottom,
      width: DASHBOARD.leftColumn.width,
      zIndex: Z.cockpitWidgets,
      pointerEvents: 'auto',
    }}
  >
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