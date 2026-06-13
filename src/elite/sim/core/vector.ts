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
  if (len < 0.0001) return zero()
  return scale(v, 1 / len)
}

export const clampMagnitude = (v: Vec3, max: number): Vec3 => {
  const len = length(v)
  if (len <= max || len === 0) return v
  return scale(v, max / len)
}

export const dot = (a: Vec3, b: Vec3): number => a.x * b.x + a.y * b.y + a.z * b.z
