import { getFrozenCartographyBodies, isNavOnlyCartographyBody } from './cartography'
import { bodyLocalPos } from './systemSpace'

export interface LandInvite {
  id: string
  name: string
  type: 'planet' | 'moon'
  dist: number
}

/** Nearest planet or moon in range and slow enough to land. */
export function nearestLandableBody(
  playerSystemPos2d: { x: number; y: number },
  systemId: string,
  playerSpeed: number,
  landRange: number,
  maxApproachSpeed: number,
): LandInvite | null {
  if (playerSpeed > maxApproachSpeed) return null

  let best: LandInvite | null = null
  for (const body of getFrozenCartographyBodies()) {
    if (body.type !== 'planet' && body.type !== 'moon') continue
    if (body.systemId !== systemId) continue
    if (isNavOnlyCartographyBody(body)) continue

    const offset = bodyLocalPos(body, playerSystemPos2d)
    const dist = Math.hypot(offset.x, offset.y, offset.z)
    if (dist <= landRange && (!best || dist < best.dist)) {
      best = { id: body.id, name: body.name, type: body.type, dist: Math.round(dist) }
    }
  }
  return best
}