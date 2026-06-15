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
import { normalize, cross } from './core/vector'
import type { CartographyBody } from './cartography'

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
 * Project world entities into the player's local body frame.
 * Forward on radar is generally +Z in the returned contacts (classic "up on scope").
 *
 * player.pos and body pos3d must both be in the local flight frame
 * (see systemSpace.bodyLocalPos).
 */
export function projectContacts(
  player: { pos: Vec3; heading: Vec3; up: Vec3 },
  npcs: Array<{ pos: Vec3; role: NpcAgent['role'] }>,
  bodies: Array<Pick<CartographyBody, 'pos3d' | 'type' | 'name' | 'id'>>,
  opts: ProjectOpts = {}
): Contact[] {
  const { pos: pPos, heading: fwd, up: upv } = player
  const right = normalize(cross(fwd, upv))

  const maxShip = opts.maxShip ?? DEFAULT_MAX_SHIP
  const maxBody = opts.maxBody ?? DEFAULT_MAX_BODY

  const contacts: Contact[] = []

  // Ships / NPCs
  for (const npc of npcs) {
    const dx = npc.pos.x - pPos.x
    const dy = npc.pos.y - pPos.y
    const dz = npc.pos.z - pPos.z
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1
    if (dist > maxShip) continue

    const localX = dx * right.x + dy * right.y + dz * right.z
    const localZ = dx * fwd.x + dy * fwd.y + dz * fwd.z
    const localY = dx * upv.x + dy * upv.y + dz * upv.z

    contacts.push({
      x: localX,
      y: localY,
      z: localZ,
      dist,
      type: 'ship',
      role: npc.role,
      name: npc.role.toUpperCase(),
    })
  }

  // Cartography bodies (planets, moons, stations)
  for (const b of bodies) {
    if (b.type === 'star') continue
    const dx = b.pos3d.x - pPos.x
    const dy = b.pos3d.y - pPos.y
    const dz = b.pos3d.z - pPos.z
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1
    if (dist > maxBody) continue

    const localX = dx * right.x + dy * right.y + dz * right.z
    const localZ = dx * fwd.x + dy * fwd.y + dz * fwd.z
    const localY = dx * upv.x + dy * upv.y + dz * upv.z

    contacts.push({
      x: localX,
      y: localY,
      z: localZ,
      dist,
      type: b.type,
      role: 'neutral',
      name: b.name,
    })
  }

  // Classic "nearby first" priority
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
