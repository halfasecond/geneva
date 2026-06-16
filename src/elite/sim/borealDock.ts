/**
 * Boreal Station docking — live fly-in to the BOREAL hull, not the cartography marker.
 */

import { BIG_SHIP, BOREAL_DOCK_BAY, BOREAL_STATION } from '../config'
import { getBodyById } from './cartography'
import type { NpcAgent, Vec3 } from './core/types'
import { add } from './core/vector'
import { stationApproachPose, type FlightPose } from './systemSpace'

const LABEL_Y_FRAC = 0.32

function rotateY(vec: Vec3, yaw: number): Vec3 {
  const c = Math.cos(yaw)
  const s = Math.sin(yaw)
  return {
    x: c * vec.x + s * vec.z,
    y: vec.y,
    z: -s * vec.x + c * vec.z,
  }
}

function borealBayForceFieldOffset(side: 'starboard' | 'port'): Vec3 {
  const scale = BIG_SHIP.scale
  const host = { x: 14.5, y: 0, z: 2, w: 4.5, h: 16, d: 22 }
  const hw = host.w * 0.5 * scale
  const hh = host.h * 0.5 * scale
  const hullInset = 0.12 * scale
  const labelHalfH = host.h * scale * BIG_SHIP.nameLabel.planeHeightMul * 0.5
  const doorH = host.h * scale * BOREAL_DOCK_BAY.heightMul
  const yLift = LABEL_Y_FRAC * hh
  const doorY = host.y * scale + yLift - labelHalfH - BOREAL_DOCK_BAY.gapBelowLabel * scale - doorH * 0.5
  const attachX = side === 'starboard'
    ? host.x * scale + hw + hullInset
    : host.x * scale - hw - hullInset
  const ffOut = (BOREAL_DOCK_BAY.surfaceOffset + BOREAL_DOCK_BAY.lipDepth * 1.1) * scale
  const outward = side === 'starboard' ? attachX + ffOut : attachX - ffOut
  const shipLocal = { x: outward, y: doorY, z: host.z * scale }
  return rotateY(shipLocal, BOREAL_STATION.freighterYaw)
}

export function borealForceFieldWorldPos(freighterPos: Vec3, side: 'starboard' | 'port' = 'starboard'): Vec3 {
  return add(freighterPos, borealBayForceFieldOffset(side))
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

export function borealFreighterAnchor(navReference2d: { x: number; y: number }): Vec3 {
  const station = getBodyById(BOREAL_STATION.id, 'frozen')
  if (!station) return { ...BOREAL_STATION.freighterOffset }
  const approach = stationApproachPose(station, navReference2d)
  return add(approach.pos, BOREAL_STATION.freighterOffset)
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

export function borealDockedPose(freighterPos: Vec3): FlightPose {
  return {
    pos: add(freighterPos, BOREAL_STATION.dockedOffset),
    heading: { x: 0, y: 0, z: 1 },
    up: { x: 0, y: 1, z: 0 },
  }
}

export function borealUndockPose(freighterPos: Vec3): FlightPose {
  const docked = borealDockedPose(freighterPos)
  return {
    pos: {
      x: docked.pos.x,
      y: docked.pos.y,
      z: docked.pos.z - BOREAL_STATION.undockBack,
    },
    heading: { x: 0, y: 0, z: -1 },
    up: { x: 0, y: 1, z: 0 },
  }
}