/**
 * Shared pure projection for "nearby things" scanners.
 * Eliminates the duplicated local-body-axes contact math that lived in both
 * the 3D holo radar updater and the 2D angled scanner canvas.
 *
 * Both radars now call this once per frame and get a consistent, sorted list.
 *
 * Re-uses the same axis construction the 3D camera + EliteSim use (player.up
 * is the integrated up after full 6DOF rotations).
 */

import type { Vec3 } from './core/types'
import type { NpcAgent } from './core/types'
import type { CartographyBody } from './cartography'
import { offsetFromPlayer, worldOffsetToBodyFrame } from './systemSpace'

export interface Contact {
  x: number // right (lateral)
  y: number // up (elevation)
  z: number // forward (depth, positive ahead)
  dist: number
  type: 'ship' | 'planet' | 'moon' | 'station'
  role?: NpcAgent['role'] | 'neutral'
  name?: string
}

export interface ProjectOpts {
  maxShip?: number
  maxBody?: number
}

const DEFAULT_MAX_SHIP = 300
const DEFAULT_MAX_BODY = 500

/**
 * Project entities into the player's local body frame.
 * Forward on radar is generally +Z in the returned contacts (classic "up on scope").
 *
 * NPC positions are absolute in the nav-anchor frame; cartography body pos3d must be
 * player-relative offsets from bodyOffsetFromPlayer / bodyLocalPos.
 */
export function projectContacts(
  player: { pos: Vec3; heading: Vec3; up: Vec3 },
  npcs: Array<{ pos: Vec3; role: NpcAgent['role'] }>,
  bodies: Array<Pick<CartographyBody, 'pos3d' | 'type' | 'name' | 'id'>>,
  opts: ProjectOpts = {}
): Contact[] {
  const { pos: pPos, heading: fwd, up: upv } = player

  const maxShip = opts.maxShip ?? DEFAULT_MAX_SHIP
  const maxBody = opts.maxBody ?? DEFAULT_MAX_BODY

  const contacts: Contact[] = []

  for (const npc of npcs) {
    const offset = offsetFromPlayer(pPos, npc.pos)
    const frame = worldOffsetToBodyFrame(offset, fwd, upv)
    if (frame.dist > maxShip) continue

    contacts.push({
      x: frame.x,
      y: frame.y,
      z: frame.z,
      dist: frame.dist,
      type: 'ship',
      role: npc.role,
      name: npc.role.toUpperCase(),
    })
  }

  for (const b of bodies) {
    if (b.type === 'star') continue
    const frame = worldOffsetToBodyFrame(b.pos3d, fwd, upv)
    if (frame.dist > maxBody) continue

    contacts.push({
      x: frame.x,
      y: frame.y,
      z: frame.z,
      dist: frame.dist,
      type: b.type,
      role: 'neutral',
      name: b.name,
    })
  }

  contacts.sort((a, b) => a.dist - b.dist)
  return contacts
}

/** Convenience: bodies only (for map or lighter scanners) */
export function projectBodies(
  player: { pos: Vec3; heading: Vec3; up: Vec3 },
  bodies: Array<Pick<CartographyBody, 'pos3d' | 'type' | 'name'>>,
  maxDist = DEFAULT_MAX_BODY
): Contact[] {
  return projectContacts(player, [], bodies as any, { maxBody: maxDist }).filter(c => c.type !== 'ship')
}