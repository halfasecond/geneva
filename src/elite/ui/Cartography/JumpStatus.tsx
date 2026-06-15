import React from 'react'
import { COLORS } from '../../config'
import { getBodyById, getJumpFuelCost } from '../../sim/cartography'
import type { CartographyRoute } from '../../render/cartographyMap'

interface JumpStatusProps {
  route: CartographyRoute
  isHyperspacing: boolean
}

const JumpStatus: React.FC<JumpStatusProps> = ({ route, isHyperspacing }) => {
  const dest = getBodyById(route.destinationId, 0)
  const origin = getBodyById(route.originId, 0)
  const cost = dest && origin
    ? getJumpFuelCost(origin.pos2d, dest.pos2d)
    : null

  return (
    <div style={{
      position: 'absolute',
      top: '36%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'rgba(0, 6, 14, 0.55)',
      boxShadow: `0 0 12px rgba(102, 170, 255, 0.25)`,
      border: `1px solid rgba(102, 170, 255, 0.2)`,
      padding: '4px 12px',
      fontSize: 11,
      color: COLORS.vechRingCss,
      textAlign: 'center',
      pointerEvents: 'none',
      fontFamily: 'ui-monospace, monospace',
      letterSpacing: '1px',
      minWidth: 120,
    }}>
      {dest?.name || 'NO TARGET'}
      {cost != null && (
        <>
          <br />
          {cost} FUEL
        </>
      )}
      {isHyperspacing && (
        <div style={{ color: '#ff6644', marginTop: 2, fontSize: 10 }}>CHARGING</div>
      )}
    </div>
  )
}

export default JumpStatus