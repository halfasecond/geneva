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
 * Render uses a floating origin: the player sits at scene (0,0,0); bodies are placed at
 * bodyOffsetFromPlayer (world-axis offset). NPC meshes subtract player.pos the same way.
 *
 * Heading convention: heading is always thrust / camera-look axis. Map depth maps to local +Z.
 * Free flight often starts at {0,0,-1}; dock poses set +Z toward the station corridor explicitly.
 *
 * Future: OnGravity / REBOUND ephemeris can feed pos2d without changing this module.
 */

import type { Vec3 } from './core/types'
import type { CartographyBody } from './cartography'
import { add, cross, dot, length, normalize, scale, subtract } from './core/vector'
import type { LocalAxes } from './core/vector'
import { getLocalAxes } from './core/vector'
import { DOCK, LAND, SPACE, VIEW } from '../config'

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

/** Body offset from player in world-aligned local axes (floating-origin render + radar). */
export function bodyLocalPos(body: Pick<CartographyBody, 'pos2d' | 'type' | 'id'>, playerSystemPos2d: Vec2): Vec3 {
  const s = SPACE.localUnitsPerMapUnit
  return {
    x: (body.pos2d.x - playerSystemPos2d.x) * s,
    y: bodyElevationOffset(body.type, body.id),
    z: (body.pos2d.y - playerSystemPos2d.y) * s,
  }
}

/** Alias — already accounts for player.pos via playerSystemPos2d; never subtract player.pos again. */
export function bodyOffsetFromPlayer(
  body: Pick<CartographyBody, 'pos2d' | 'type' | 'id'>,
  playerSystemPos2d: Vec2,
): Vec3 {
  return bodyLocalPos(body, playerSystemPos2d)
}

/** Catalog pos3d when system origin is the star (map display / legacy callers). */
export function catalogLocalPos(body: Pick<CartographyBody, 'pos2d' | 'type' | 'id'>): Vec3 {
  return bodyLocalPos(body, { x: 0, y: 0 })
}

/** Station pose in the player's current nav-local frame (nav ref may differ from station map pos). */
export function stationApproachPose(
  station: Pick<CartographyBody, 'pos2d' | 'type' | 'id'>,
  navReference2d: Vec2,
): FlightPose {
  const stationLocal = bodyLocalPos(station, navReference2d)
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

export function stationDockedPose(
  station: Pick<CartographyBody, 'pos2d' | 'type' | 'id'>,
  navReference2d: Vec2,
): FlightPose {
  const stationLocal = bodyLocalPos(station, navReference2d)
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

/** Pre-dock approach pose when nav anchor equals station system pos2d. */
export function approachPose(station: Pick<CartographyBody, 'pos2d' | 'type' | 'id'>): FlightPose {
  return stationApproachPose(station, station.pos2d)
}

/** Docked pose — inside the approach corridor, facing the station slot. */
export function dockedPose(station: Pick<CartographyBody, 'pos2d' | 'type' | 'id'>): FlightPose {
  return stationDockedPose(station, station.pos2d)
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

/** Standoff pose after hyperspace or cold start — always in flight, never docked. */
export function hyperspaceArrivalPose(body: Pick<CartographyBody, 'pos2d' | 'type' | 'id'>): FlightPose {
  return body.type === 'station' ? approachPose(body) : arrivalPose(body)
}

/** Surface landing pose — tucked in near the body holo, facing inward. */
export function surfaceLandingPose(
  body: Pick<CartographyBody, 'pos2d' | 'type' | 'id'>,
  navReference2d: Vec2,
): FlightPose {
  const bodyLocal = bodyLocalPos(body, navReference2d)
  return {
    pos: {
      x: bodyLocal.x,
      y: 0,
      z: bodyLocal.z - LAND.surfaceOffset,
    },
    heading: { x: 0, y: 0, z: 1 },
    up: { x: 0, y: 1, z: 0 },
  }
}

/** Short hop back from the surface before resuming free flight. */
export function surfaceTakeoffPose(
  body: Pick<CartographyBody, 'pos2d' | 'type' | 'id'>,
  navReference2d: Vec2,
): FlightPose {
  const landed = surfaceLandingPose(body, navReference2d)
  return {
    pos: {
      x: landed.pos.x,
      y: landed.pos.y,
      z: landed.pos.z - LAND.takeoffBackDistance,
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

export interface BodyFrameOffset {
  x: number
  y: number
  z: number
  dist: number
}

/** Offset from player to an entity stored in absolute nav-anchor coordinates. */
export function offsetFromPlayer(playerPos: Vec3, worldPos: Vec3): Vec3 {
  return {
    x: worldPos.x - playerPos.x,
    y: worldPos.y - playerPos.y,
    z: worldPos.z - playerPos.z,
  }
}

/**
 * Orthonormal view basis from integrated attitude.
 * Uses heading as forward and up as a hint (matches Three.js camera lookAt).
 */
export function viewBasisFromAttitude(heading: Vec3, upHint: Vec3): LocalAxes {
  const f = normalize(heading)
  const hint = normalize(upHint)
  let r = cross(f, hint)
  const rlen = length(r)
  if (rlen < 1e-4) return getLocalAxes(heading, 0)
  r = scale(r, 1 / rlen)
  const u = normalize(cross(r, f))
  return { forward: f, right: r, up: u }
}

/** Cockpit eye position in the floating-origin frame (matches Elite.tsx camera). */
export function cockpitEyeOffset(heading: Vec3, up: Vec3): Vec3 {
  const axes = viewBasisFromAttitude(heading, up)
  return add(scale(axes.forward, -VIEW.cockpitBack), scale(axes.up, VIEW.eyeHeight))
}

export interface BodyFrameOpts {
  /** When true, offset is from ship origin; subtract eye offset so projection matches the camera. */
  fromCockpitEye?: boolean
}

/** Rotate a world-axis offset into the ship body frame (waypoints, radar). */
export function worldOffsetToBodyFrame(
  offset: Vec3,
  heading: Vec3,
  up: Vec3,
  opts: BodyFrameOpts = {},
): BodyFrameOffset {
  const axes = viewBasisFromAttitude(heading, up)
  const v = opts.fromCockpitEye ? subtract(offset, cockpitEyeOffset(heading, up)) : offset
  const dist = length(v) || 1
  return {
    x: dot(v, axes.right),
    y: dot(v, axes.up),
    z: dot(v, axes.forward),
    dist,
  }
}

export function distanceLocal(a: Vec3, b: Vec3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
}

/** Bodies outside this radius are culled from the local bubble (Elite FAROF analogue). */
export function isInsideBubble(localPos: Vec3): boolean {
  return distanceLocal(localPos, { x: 0, y: 0, z: 0 }) <= SPACE.bubbleRadius
}

/** Cartography bodies that match what the 3D bubble actually renders (excludes nav-only markers). */
export type RadarBodyContact = Pick<CartographyBody, 'id' | 'name' | 'type' | 'navOnly'> & { pos3d: Vec3 }

export function radarVisibleBodies(
  bodies: CartographyBody[],
  playerSystemPos2d: Vec2,
): RadarBodyContact[] {
  return bodies
    .filter(b => b.type !== 'star' && !b.navOnly)
    .map(b => ({
      id: b.id,
      name: b.name,
      type: b.type,
      navOnly: b.navOnly,
      pos3d: bodyLocalPos(b, playerSystemPos2d),
    }))
    .filter(b => isInsideBubble(b.pos3d))
}