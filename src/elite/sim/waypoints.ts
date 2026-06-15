/**
 * Waypoint stars on the cockpit windscreen.
 *
 * DEBUG MODE (WAYPOINTS.debugHardcoded): one fixed star at debugOffset in scene space.
 * Player is at the floating-origin (0,0,0). Star bearing should only move with attitude.
 *
 * Controls (useFlightInput): A/D = yaw, Q/E = pitch, Z/X = roll.
 * Horizontal screen position uses signed angle on the XZ plane — monotonic with yaw,
 * no |nx|>1 cliff that made the star pin to the rim then snap back.
 */

import { getBodyById, getFrozenCartographyBodies } from './cartography'
import { bodyElevationOffset, isInsideBubble } from './systemSpace'
import type { Vec3 } from './core/types'
import { VIEW, WAYPOINTS, WINDSCREEN } from '../config'

export interface WaypointIndicator {
  id: string
  name: string
  label: string
  type: 'planet' | 'star'
  distLocal: number
  screenX: number
  screenY: number
  behind: boolean
  isDestination: boolean
}

export interface ViewportSize {
  width: number
  height: number
}

const TAN_HALF_VFOV = Math.tan((VIEW.fov * 0.5) * (Math.PI / 180))
const V_HALF_FOV = (VIEW.fov * 0.5) * (Math.PI / 180)

function abbreviate(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) {
    return (words[0].slice(0, 2) + words[1].slice(0, 1)).toUpperCase()
  }
  return name.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || '???'
}

function resolveDestinationPlanetId(destinationId?: string): string | undefined {
  if (!destinationId) return undefined
  const body = getBodyById(destinationId, 'frozen')
  if (!body) return undefined
  if (body.type === 'planet') return body.id
  return body.parentId
}

function clamp01(v: number): number {
  return Math.max(0.04, Math.min(0.96, v))
}

function normalizeAngle(a: number): number {
  let x = a
  while (x > Math.PI) x -= Math.PI * 2
  while (x < -Math.PI) x += Math.PI * 2
  return x
}

/** Signed horizontal angle (radians) from heading.xz to offset.xz. Smooth under yaw (A/D). */
export function horizontalSignedAngle(
  heading: Vec3,
  offset: { x: number; z: number },
): number {
  const fl = Math.hypot(heading.x, heading.z)
  const ol = Math.hypot(offset.x, offset.z)
  if (fl < 1e-6 || ol < 1e-6) return 0
  const dot = (heading.x * offset.x + heading.z * offset.z) / (fl * ol)
  const cross = (heading.x * offset.z - heading.z * offset.x) / (fl * ol)
  return Math.atan2(cross, dot)
}

function pitchFromHeading(heading: Vec3): number {
  const len = Math.hypot(heading.x, heading.y, heading.z) || 1
  return Math.asin(Math.max(-1, Math.min(1, heading.y / len)))
}

/** Map signed angle (rad) to inset windscreen coord 0–1; clamps to rim monotonically. */
function angleToInsetCoord(angle: number, halfFov: number, halfInset: number): number {
  const t = angle / halfFov
  const clamped = Math.sign(t) * Math.min(Math.abs(t), 1)
  return 0.5 + clamped * halfInset
}

/** Project a scene-space offset into windscreen 0–1 coords. */
export function projectOffsetToWindscreen(
  offset: { x: number; y: number; z: number },
  heading: Vec3,
  viewport: ViewportSize,
): { x: number; y: number; behind: boolean } {
  const inset = WAYPOINTS.edgeInset
  const halfW = 0.5 - inset
  const halfH = 0.5 - inset
  const aspect = viewport.width / Math.max(viewport.height, 1)
  const hHalfFov = Math.atan(TAN_HALF_VFOV * aspect)

  let relH = horizontalSignedAngle(heading, offset)
  const flatDot =
    heading.x * offset.x + heading.z * offset.z
  const behind = flatDot < 0

  if (behind) relH = normalizeAngle(relH + Math.PI)

  const planeDist = Math.hypot(offset.x, offset.z) || 1
  const elevAngle = Math.atan2(offset.y, planeDist)
  const relV = elevAngle - pitchFromHeading(heading)

  const vpX = angleToInsetCoord(relH, hHalfFov, halfW)
  const vpY = angleToInsetCoord(-relV, V_HALF_FOV, halfH)

  const px = vpX * viewport.width
  const py = vpY * viewport.height

  const wsW = viewport.width - WINDSCREEN.left - WINDSCREEN.right
  const wsH = viewport.height - WINDSCREEN.top - WINDSCREEN.bottom

  return {
    x: clamp01((px - WINDSCREEN.left) / wsW),
    y: clamp01((py - WINDSCREEN.top) / wsH),
    behind,
  }
}

function hardcodedDebugWaypoint(heading: Vec3, viewport: ViewportSize): WaypointIndicator {
  const off = WAYPOINTS.debugOffset
  const screen = projectOffsetToWindscreen(off, heading, viewport)
  const dist = Math.hypot(off.x, off.y, off.z)

  return {
    id: 'debug-star',
    name: 'Debug bearing',
    label: 'DBG',
    type: 'planet',
    distLocal: dist,
    screenX: screen.x,
    screenY: screen.y,
    behind: screen.behind,
    isDestination: true,
  }
}

export function computeWaypoints(
  player: {
    heading: Vec3
    systemPos2d: { x: number; y: number }
  },
  opts: {
    destinationId?: string
    viewport?: ViewportSize
  } = {},
): WaypointIndicator[] {
  const viewport = opts.viewport ?? { width: 1920, height: 1080 }

  if (WAYPOINTS.debugHardcoded) {
    const dbg = hardcodedDebugWaypoint(player.heading, viewport)
    return dbg.behind ? [] : [dbg]
  }

  const destPlanetId = resolveDestinationPlanetId(opts.destinationId)
  const bodies = getFrozenCartographyBodies()
  const result: WaypointIndicator[] = []

  for (const body of bodies) {
    if (body.type !== 'planet' && body.type !== 'star') continue

    const s = 12
    const x = (body.pos2d.x - player.systemPos2d.x) * s
    const z = (body.pos2d.y - player.systemPos2d.y) * s
    const y = bodyElevationOffset(body.type, body.id)
    const dist = Math.hypot(x, y, z)

    if (body.type !== 'star' && isInsideBubble({ x, y, z })) continue
    if (dist < WAYPOINTS.minLocalDist) continue

    const screen = projectOffsetToWindscreen({ x, y, z }, player.heading, viewport)
    if (screen.behind) continue

    result.push({
      id: body.id,
      name: body.name,
      label: abbreviate(body.name),
      type: body.type === 'star' ? 'star' : 'planet',
      distLocal: dist,
      screenX: screen.x,
      screenY: screen.y,
      behind: screen.behind,
      isDestination: body.id === destPlanetId,
    })
  }

  result.sort((a, b) => {
    if (a.isDestination !== b.isDestination) return a.isDestination ? -1 : 1
    return a.distLocal - b.distLocal
  })

  return result
}