/**
 * Boreal Station docking — poses derived from the same bay frame as borealDockBay.ts.
 * Fly-in: approach standoff → through force field → hangar interior.
 * Undock: reverses along the same axis back to approach standoff.
 */

import { BIG_SHIP, BOREAL_DOCK_BAY, BOREAL_STATION, DOCK, DOCK_LIVE } from '../config'
import { getBodyById } from './cartography'
import type { NpcAgent, Vec3 } from './core/types'
import { add, scale, subtract } from './core/vector'
import type { FlightPose } from './systemSpace'
import { bodyLocalPos, isInsideBubble } from './systemSpace'

export type BorealDockSide = 'starboard' | 'port'

const LABEL_Y_FRAC = 0.32

const HOST_BLOCKS: Record<BorealDockSide, { x: number; y: number; z: number; w: number; h: number; d: number }> = {
  starboard: { x: 14.5, y: 0, z: 2, w: 4.5, h: 16, d: 22 },
  port: { x: -14.5, y: 0, z: 2, w: 4.5, h: 16, d: 22 },
}

function rotateY(vec: Vec3, yaw: number): Vec3 {
  const c = Math.cos(yaw)
  const s = Math.sin(yaw)
  return {
    x: c * vec.x + s * vec.z,
    y: vec.y,
    z: -s * vec.x + c * vec.z,
  }
}

function normalize(vec: Vec3): Vec3 {
  const len = Math.hypot(vec.x, vec.y, vec.z) || 1
  return { x: vec.x / len, y: vec.y / len, z: vec.z / len }
}

function bayAttachmentShipLocal(side: BorealDockSide): Vec3 {
  const s = BIG_SHIP.scale
  const host = HOST_BLOCKS[side]
  const hw = host.w * 0.5 * s
  const hh = host.h * 0.5 * s
  const hullInset = 0.12 * s
  const labelHalfH = host.h * s * BIG_SHIP.nameLabel.planeHeightMul * 0.5
  const doorH = host.h * s * BOREAL_DOCK_BAY.heightMul
  const yLift = LABEL_Y_FRAC * hh
  const doorY = host.y * s + yLift - labelHalfH - BOREAL_DOCK_BAY.gapBelowLabel * s - doorH * 0.5
  const x = side === 'starboard'
    ? host.x * s + hw + hullInset
    : host.x * s - hw - hullInset
  return { x, y: doorY, z: host.z * s }
}

function bayLocalToShipLocal(side: BorealDockSide, bayLocal: Vec3): Vec3 {
  const bayYaw = side === 'starboard' ? Math.PI / 2 : -Math.PI / 2
  return add(bayAttachmentShipLocal(side), rotateY(bayLocal, bayYaw))
}

function shipLocalToWorld(freighterPos: Vec3, shipLocal: Vec3): Vec3 {
  return add(freighterPos, rotateY(shipLocal, BOREAL_STATION.freighterYaw))
}

/** Bay-local +Z is outward (approach runway); −Z is into the hangar. */
export function bayLocalToWorld(freighterPos: Vec3, side: BorealDockSide, bayLocal: Vec3): Vec3 {
  return shipLocalToWorld(freighterPos, bayLocalToShipLocal(side, bayLocal))
}

function bayAxisWorld(side: BorealDockSide, bayAxis: Vec3): Vec3 {
  const shipLocal = rotateY(bayAxis, side === 'starboard' ? Math.PI / 2 : -Math.PI / 2)
  return normalize(rotateY(shipLocal, BOREAL_STATION.freighterYaw))
}

function forceFieldBayZ(): number {
  const s = BIG_SHIP.scale
  return (BOREAL_DOCK_BAY.surfaceOffset + BOREAL_DOCK_BAY.lipDepth * 1.1) * s
}

function approachStandoffBayZ(side: BorealDockSide): number {
  const s = BIG_SHIP.scale
  const host = HOST_BLOCKS[side]
  const runway = host.d * s * BOREAL_DOCK_BAY.approachGuideRunwayMul
  return forceFieldBayZ() + runway * 0.5 + DOCK_LIVE.approachStandoff
}

function dockInteriorBayZ(side: BorealDockSide): number {
  const s = BIG_SHIP.scale
  const host = HOST_BLOCKS[side]
  return forceFieldBayZ() - host.d * s * BOREAL_STATION.dockInteriorMul
}

export function borealForceFieldWorldPos(freighterPos: Vec3, side: BorealDockSide = 'starboard'): Vec3 {
  return bayLocalToWorld(freighterPos, side, { x: 0, y: 0, z: forceFieldBayZ() })
}

export function distanceToBorealForceField(playerPos: Vec3, freighterPos: Vec3): number {
  const fields = (['starboard', 'port'] as const).map(side => borealForceFieldWorldPos(freighterPos, side))
  return Math.min(
    ...fields.map(field => Math.hypot(
      playerPos.x - field.x,
      playerPos.y - field.y,
      playerPos.z - field.z,
    )),
  )
}

export function nearestBorealBaySide(playerPos: Vec3, freighterPos: Vec3): BorealDockSide {
  const sides = (['starboard', 'port'] as const).map(side => ({
    side,
    dist: Math.hypot(
      playerPos.x - borealForceFieldWorldPos(freighterPos, side).x,
      playerPos.y - borealForceFieldWorldPos(freighterPos, side).y,
      playerPos.z - borealForceFieldWorldPos(freighterPos, side).z,
    ),
  }))
  return sides.sort((a, b) => a.dist - b.dist)[0].side
}

/** Skybox offset from the station approach corridor (polar layout from first Big Ship pass). */
export function borealFreighterSpawnPos(anchor: Vec3): Vec3 {
  const { angle, radius, zOffset, yScale } = BOREAL_STATION.spawn
  return {
    x: anchor.x + Math.cos(angle) * radius,
    y: anchor.y + Math.sin(angle) * radius * yScale,
    z: anchor.z + zOffset,
  }
}

/** BOREAL hull anchored at Boreal Station — not the player's position. */
export function borealFreighterWorldPos(systemPos2d: { x: number; y: number }): Vec3 {
  const station = getBodyById(BOREAL_STATION.id, 'frozen')
  if (!station) return { x: 0, y: 0, z: 0 }

  const stationLocal = bodyLocalPos(station, systemPos2d)
  const approach = {
    x: stationLocal.x,
    y: 0,
    z: stationLocal.z - DOCK.approachDistance,
  }
  return borealFreighterSpawnPos(approach)
}

export function isBorealFreighterInBubble(playerPos: Vec3, freighterPos: Vec3): boolean {
  return isInsideBubble({
    x: freighterPos.x - playerPos.x,
    y: freighterPos.y - playerPos.y,
    z: freighterPos.z - playerPos.z,
  })
}

export function findBorealFreighter(npcs: NpcAgent[]): NpcAgent | undefined {
  return npcs.find(n => n.designation === BIG_SHIP.nameLabel.text || n.role === 'freighter')
}

export function nearestBorealDock(
  playerPos: Vec3,
  freighterPos: Vec3,
  speed: number,
  maxApproachSpeed: number,
): { id: string; name: string; dist: number } | null {
  if (speed > maxApproachSpeed) return null
  const dist = distanceToBorealForceField(playerPos, freighterPos)
  if (dist > BOREAL_STATION.dockRange) return null
  return { id: BOREAL_STATION.id, name: BOREAL_STATION.name, dist: Math.round(dist) }
}

/** Outside the force field on the approach runway, facing into the bay. */
export function borealApproachPose(freighterPos: Vec3, side: BorealDockSide): FlightPose {
  const inward = bayAxisWorld(side, { x: 0, y: 0, z: -1 })
  return {
    pos: bayLocalToWorld(freighterPos, side, { x: 0, y: 0, z: approachStandoffBayZ(side) }),
    heading: inward,
    up: { x: 0, y: 1, z: 0 },
  }
}

/** Inside the hangar on the bay centreline, still facing inward. */
export function borealDockedPose(freighterPos: Vec3, side: BorealDockSide): FlightPose {
  const inward = bayAxisWorld(side, { x: 0, y: 0, z: -1 })
  return {
    pos: bayLocalToWorld(freighterPos, side, { x: 0, y: 0, z: dockInteriorBayZ(side) }),
    heading: inward,
    up: { x: 0, y: 1, z: 0 },
  }
}

/**
 * Fly-in start — project the player onto the bay centreline so entry stays in the corridor.
 * Falls back to the approach standoff when still outside the tunnel.
 */
export function borealFlyInStartPose(
  playerPos: Vec3,
  freighterPos: Vec3,
  side: BorealDockSide,
): FlightPose {
  const approach = borealApproachPose(freighterPos, side)
  const docked = borealDockedPose(freighterPos, side)
  const corridor = subtract(docked.pos, approach.pos)
  const axisLen = Math.hypot(corridor.x, corridor.y, corridor.z) || 1
  const axis = scale(corridor, 1 / axisLen)
  const along = (playerPos.x - approach.pos.x) * axis.x
    + (playerPos.y - approach.pos.y) * axis.y
    + (playerPos.z - approach.pos.z) * axis.z

  if (along >= 0 && along <= axisLen * 0.88) {
    return {
      pos: add(approach.pos, scale(axis, along)),
      heading: approach.heading,
      up: approach.up,
    }
  }

  return approach
}

/** Same standoff as approach, facing back out along the entry corridor. */
export function borealUndockPose(freighterPos: Vec3, side: BorealDockSide): FlightPose {
  const inward = bayAxisWorld(side, { x: 0, y: 0, z: -1 })
  return {
    pos: bayLocalToWorld(freighterPos, side, { x: 0, y: 0, z: approachStandoffBayZ(side) }),
    heading: scale(inward, -1),
    up: { x: 0, y: 1, z: 0 },
  }
}