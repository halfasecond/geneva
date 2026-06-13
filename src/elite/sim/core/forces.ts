import type { NpcAgent, SimConfig, Vec3 } from './types'
import { add, length, normalize, scale, subtract, zero } from './vector'

export function calculateSeparation(
  self: NpcAgent,
  agents: NpcAgent[],
  config: SimConfig,
): Vec3 {
  let force = zero()

  for (const other of agents) {
    if (other.id === self.id) continue
    const delta = subtract(other.pos, self.pos)
    const r = length(delta)
    if (r <= 0.0001 || r >= config.separationRadius) continue
    force = add(force, scale(normalize(delta), -config.separationStrength))
  }

  return force
}

export function calculateCohesion(
  self: NpcAgent,
  agents: NpcAgent[],
  config: SimConfig,
): Vec3 {
  let force = zero()

  for (const other of agents) {
    if (other.id === self.id) continue
    const delta = subtract(other.pos, self.pos)
    const r = length(delta)
    if (r <= 0.0001 || r >= config.cohesionRadius) continue

    // κ-framework from Flocker (exponential social attraction)
    const curvedForce = Math.exp(config.k0 * r * 0.018) / r
    force = add(force, scale(normalize(delta), curvedForce * config.cohesionStrength))
  }

  return force
}

export function calculateAlignment(
  self: NpcAgent,
  agents: NpcAgent[],
  config: SimConfig,
): Vec3 {
  let averageVelocity = zero()
  let neighbours = 0

  for (const other of agents) {
    if (other.id === self.id) continue
    const delta = subtract(other.pos, self.pos)
    if (length(delta) >= config.alignmentRadius) continue
    averageVelocity = add(averageVelocity, other.vel)
    neighbours += 1
  }

  if (neighbours === 0) return zero()
  averageVelocity = scale(averageVelocity, 1 / neighbours)
  return scale(normalize(averageVelocity), config.alignmentStrength)
}

export function calculateFlocking(
  self: NpcAgent,
  agents: NpcAgent[],
  config: SimConfig,
): Vec3 {
  let accel = zero()
  accel = add(accel, calculateSeparation(self, agents, config))
  accel = add(accel, calculateCohesion(self, agents, config))
  accel = add(accel, calculateAlignment(self, agents, config))
  return accel
}
