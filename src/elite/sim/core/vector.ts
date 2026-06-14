import type { Vec3 } from './types'

export const zero = (): Vec3 => ({ x: 0, y: 0, z: 0 })

export const add = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.x + b.x,
  y: a.y + b.y,
  z: a.z + b.z,
})

export const subtract = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.x - b.x,
  y: a.y - b.y,
  z: a.z - b.z,
})

export const scale = (v: Vec3, s: number): Vec3 => ({
  x: v.x * s,
  y: v.y * s,
  z: v.z * s,
})

export const length = (v: Vec3): number => Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)

export const normalize = (v: Vec3): Vec3 => {
  const len = length(v)
  if (len < 0.0001) {
    // Never return a true zero for orientation vectors – return a safe default forward.
    // This prevents total collapse even under extreme numeric conditions.
    return { x: 0, y: 0, z: -1 }
  }
  return scale(v, 1 / len)
}

export const clampMagnitude = (v: Vec3, max: number): Vec3 => {
  const len = length(v)
  if (len <= max || len === 0) return v
  return scale(v, max / len)
}

export const dot = (a: Vec3, b: Vec3): number => a.x * b.x + a.y * b.y + a.z * b.z

export const cross = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
})

export interface LocalAxes {
  forward: Vec3
  right: Vec3
  up: Vec3
}

/**
 * Returns an orthonormal local basis for the ship given its forward heading and current roll (in radians).
 * This stays valid even after full pitch loops (unlike the previous "y=0" approximation).
 * Positive roll banks the ship (right wing down for classic aircraft sense; Z/X keys will feel natural).
 */
export function getLocalAxes(heading: Vec3, roll: number = 0): LocalAxes {
  const f = normalize(heading)

  // To support arbitrary orientations (full pitch/yaw loops in space, no "up" planet reference),
  // choose the world axis that is *most orthogonal* to f as the reference for constructing
  // the initial "right". This avoids the degeneracy when heading points near world Y (or any axis).
  const worldRefs: Vec3[] = [
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 1 },
    { x: 1, y: 0, z: 0 },
  ]

  let bestRef = worldRefs[0]
  let bestAbsDot = Math.abs(dot(f, bestRef))
  for (let i = 1; i < worldRefs.length; i++) {
    const d = Math.abs(dot(f, worldRefs[i]))
    if (d < bestAbsDot) {
      bestAbsDot = d
      bestRef = worldRefs[i]
    }
  }

  // Build an initial right perpendicular to f and the chosen ref.
  // Using cross(f, bestRef) gives a right that for the classic level forward case
  // produces the same (1,0,0) right as the legacy code.
  let r = normalize(cross(f, bestRef))

  // If still degenerate (shouldn't happen), fall back
  if (length(r) < 0.0001) {
    r = normalize({ x: 1, y: 0, z: 0 })
  }

  // "up" computed so that for the common level case (heading -Z), up points +world Y (pilot's sky).
  // Using cross(r, f) gives the opposite of f × r, producing positive Y here.
  let u = normalize(cross(r, f))

  // Apply pilot roll (twist around forward / heading).
  // Because u is now defined as cross(r, f) (to get +world Y for level case),
  // we flip the signs on the sin terms so that a positive roll value still banks
  // the ship in the same direction as before (right wing "down" relative to pilot).
  const c = Math.cos(roll)
  const s = Math.sin(roll)

  const rolledRight: Vec3 = {
    x: r.x * c - u.x * s,
    y: r.y * c - u.y * s,
    z: r.z * c - u.z * s,
  }
  const rolledUp: Vec3 = {
    x: u.x * c + r.x * s,
    y: u.y * c + r.y * s,
    z: u.z * c + r.z * s,
  }

  const nr = normalize(rolledRight)
  const nu = normalize(rolledUp)

  return {
    forward: f,
    right: nr,
    up: nu,
  }
}
