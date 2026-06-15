import { describe, it, expect } from 'vitest'
import {
  computeWaypoints,
  horizontalSignedAngle,
  projectOffsetToWindscreen,
} from './waypoints'
import { WAYPOINTS } from '../config'

const OFF = WAYPOINTS.debugOffset
const VP = { width: 1600, height: 900 }

function yawHeading(yaw: number): { x: number; y: number; z: number } {
  return { x: Math.sin(yaw), y: 0, z: Math.cos(yaw) }
}

describe('waypoint debug star', () => {
  it('returns exactly one DBG star', () => {
    const result = computeWaypoints(
      { heading: { x: 0, y: 0, z: -1 }, systemPos2d: { x: 0, y: 0 } },
      { viewport: VP },
    )
    expect(result).toHaveLength(1)
    expect(result[0].label).toBe('DBG')
  })

  it('screen X is monotonic while yawing toward the target (no rim snap-back)', () => {
    const bearing = Math.atan2(OFF.x, OFF.z)
    const xs: number[] = []

    for (let i = 0; i <= 40; i++) {
      const yaw = Math.PI - i * 0.04
      const h = yawHeading(yaw)
      const rel = horizontalSignedAngle(h, OFF)
      if (Math.abs(rel) > Math.PI / 2) continue
      const s = projectOffsetToWindscreen(OFF, h, VP)
      xs.push(s.x)
    }

    for (let i = 1; i < xs.length; i++) {
      expect(xs[i]).toBeGreaterThanOrEqual(xs[i - 1] - 0.001)
    }
  })

  it('screen X changes smoothly under pure yaw (A/D axis)', () => {
    const a = projectOffsetToWindscreen(OFF, yawHeading(2.2), VP)
    const b = projectOffsetToWindscreen(OFF, yawHeading(2.5), VP)
    expect(a.x).not.toBeCloseTo(b.x, 1)
  })
})