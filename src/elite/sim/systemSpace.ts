/**
 * Layered space frames for Geneva / Vech.
 *
 * Galaxy (Ly) → System (map units / AU) → Local flight (meters, player ship)
 *
 * pos2d on cartography bodies is authoritative for the system orbital plane.
 * player.pos is local flight space: x = lateral, y = elevation, z = depth (map y).
 * player.navReference2d is the system pos2d that corresponds to local (0, 0, 0).
 * player.systemPos2d is updated each sim step from navReference2d + local offset.
 *
 * Future: OnGravity / REBOUND ephemeris can feed pos2d without changing this module.
 */

import type { Vec3 } from './core/types'
import type { CartographyBody } from './cartography'
import { DOCK, SPACE } from '../config'

export interface Vec2 {
  x: number
  y: number
}

export interface FlightPose {
  pos: Vec3
  heading: Vec3
  up: Vec3
}

/** Vertical offset above the cruise plane for decorative 3D spread (local units). */
export function bodyElevationOffset(type: CartographyBody['type'], id: string): number {
  if (type === 'star') return 0
  const wobble = Math.sin(id.length * 1.7) * 4
  if (type === 'station') return 18 + wobble
  if (type === 'moon') return 8 + wobble
  return wobble
}

/** Map-unit delta → local flight offset (x lateral, z depth). */
export function systemDeltaToLocal(dx: number, dy: number): Vec3 {
  const s = SPACE.localUnitsPerMapUnit
  return { x: dx * s, y: 0, z: dy * s }
}

/** Local flight offset (x, z) → map-unit delta on the orbital plane. */
export function localOffsetToSystemDelta(localPos: Vec3): Vec2 {
  const s = SPACE.localUnitsPerMapUnit
  return { x: localPos.x / s, y: localPos.z / s }
}

/** System pos2d for a player given nav anchor + local position. */
export function systemPos2dFromLocal(navReference2d: Vec2, localPos: Vec3): Vec2 {
  const d = localOffsetToSystemDelta(localPos)
  return { x: navReference2d.x + d.x, y: navReference2d.y + d.y }
}

/** Body position in the player's local flight frame. */
export function bodyLocalPos(body: Pick<CartographyBody, 'pos2d' | 'type' | 'id'>, playerSystemPos2d: Vec2): Vec3 {
  const s = SPACE.localUnitsPerMapUnit
  return {
    x: (body.pos2d.x - playerSystemPos2d.x) * s,
    y: bodyElevationOffset(body.type, body.id),
    z: (body.pos2d.y - playerSystemPos2d.y) * s,
  }
}

/** Catalog pos3d when system origin is the star (map display / legacy callers). */
export function catalogLocalPos(body: Pick<CartographyBody, 'pos2d' | 'type' | 'id'>): Vec3 {
  return bodyLocalPos(body, { x: 0, y: 0 })
}

/** Pre-dock approach pose in local space when nav anchor equals station system pos2d. */
export function approachPose(station: Pick<CartographyBody, 'pos2d' | 'type' | 'id'>): FlightPose {
  const stationLocal = bodyLocalPos(station, station.pos2d)
  return {
    pos: {
      x: stationLocal.x,
      y: 0,
      z: stationLocal.z - DOCK.approachDistance,
    },
    heading: { x: 0, y: 0, z: 1 },
    up: { x: 0, y: 1, z: 0 },
  }
}

/** Docked pose — inside the approach corridor, facing the station slot. */
export function dockedPose(station: Pick<CartographyBody, 'pos2d' | 'type' | 'id'>): FlightPose {
  const stationLocal = bodyLocalPos(station, station.pos2d)
  return {
    pos: {
      x: stationLocal.x,
      y: 0,
      z: stationLocal.z - DOCK.dockedDistance,
    },
    heading: { x: 0, y: 0, z: 1 },
    up: { x: 0, y: 1, z: 0 },
  }
}

/** Undock departure pose — nudged back along -heading with mild outward velocity implied by caller. */
export function undockPose(station: Pick<CartographyBody, 'pos2d' | 'type' | 'id'>): FlightPose {
  const docked = dockedPose(station)
  return {
    pos: {
      x: docked.pos.x,
      y: docked.pos.y,
      z: docked.pos.z - DOCK.undockBackDistance,
    },
    heading: { x: 0, y: 0, z: -1 },
    up: { x: 0, y: 1, z: 0 },
  }
}

/** Arrival offset when jumping to a non-station body — offset from body along -Z. */
export function arrivalPose(body: Pick<CartographyBody, 'pos2d' | 'type' | 'id'>): FlightPose {
  const center = bodyLocalPos(body, body.pos2d)
  return {
    pos: {
      x: center.x,
      y: 0,
      z: center.z - SPACE.arrivalStandoff,
    },
    heading: { x: 0, y: 0, z: 1 },
    up: { x: 0, y: 1, z: 0 },
  }
}

export function distanceLocal(a: Vec3, b: Vec3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
}

/** Bodies outside this radius are culled from the local bubble (Elite FAROF analogue). */
export function isInsideBubble(localPos: Vec3): boolean {
  return distanceLocal(localPos, { x: 0, y: 0, z: 0 }) <= SPACE.bubbleRadius
}