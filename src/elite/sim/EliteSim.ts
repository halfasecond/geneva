import type { EliteSnapshot, FlightMode, NpcAgent, PlayerState, SimConfig } from './core/types'
import { add, clampMagnitude, cross, length, normalize, scale, subtract, zero } from './core/vector'
import { calculateFlocking } from './core/forces'
import { addProgress, applyRoleFeedback } from './core/progress'
import { getBodyById, DEFAULT_ROUTE } from './cartography'

const DEFAULT_CONFIG: SimConfig = {
  separationRadius: 28,
  separationStrength: 1.6,
  cohesionRadius: 65,
  cohesionStrength: 0.9,
  alignmentRadius: 55,
  alignmentStrength: 0.75,
  maxSpeed: 18,
  accelScale: 0.9,
  drag: 0.985,
  k0: 1.0,
}

export class EliteSim {
  private npcs: NpcAgent[] = []
  private player: PlayerState
  private config: SimConfig
  private time = 0

  constructor(initialPopulation = 2) {
    this.config = { ...DEFAULT_CONFIG }
    const origin = getBodyById(DEFAULT_ROUTE.originId, 'frozen')
    this.player = {
      pos: { x: 0, y: 120, z: 40 },
      vel: { x: 0, y: 0, z: -6 },
      heading: { x: 0, y: 0, z: -1 },
      up: { x: 0, y: 1, z: 0 },
      roll: 0,
      speed: 6,
      fuel: 120,
      systemId: origin?.systemId ?? 'helios',
      systemPos2d: { ...(origin?.pos2d ?? { x: 0, y: 0 }) },
      flightMode: 'normal',
      dockedAtStationId: null,
    }
    this.resetNpcs(initialPopulation)
  }

  resetNpcs(count: number) {
    this.npcs = []
    const roles: NpcAgent['role'][] = ['trader', 'trader', 'pirate', 'police', 'escort', 'trader']

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const radius = 80 + (i % 5) * 12
      this.npcs.push({
        id: i,
        pos: {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius * 0.6 + (i % 3 - 1) * 8,
          z: (Math.random() - 0.5) * 40,
        },
        vel: {
          x: -Math.sin(angle) * (1.5 + Math.random()),
          y: Math.cos(angle) * (1.2 + Math.random()),
          z: (Math.random() - 0.5) * 2,
        },
        mass: 0.8 + Math.random() * 0.6,
        progress: Math.random(),
        orientation: Math.random() > 0.5 ? 1 : -1,
        flips: 0,
        crowdPressure: 0,
        contagionPressure: 0,
        pressure: 0,
        role: roles[i % roles.length],
      })
    }
  }

  getConfig() {
    return this.config
  }

  setConfig(partial: Partial<SimConfig>) {
    this.config = { ...this.config, ...partial }
  }

  step(deltaSeconds: number, playerInput: { thrust: number; yaw: number; pitch: number; roll: number }) {
    this.time += deltaSeconds

    // --- Player update (direct control, elite-style) ---
    const p = this.player
    const thrust = Math.max(-0.6, Math.min(1.6, playerInput.thrust))
    const yaw = playerInput.yaw * 1.8
    const pitch = playerInput.pitch * 1.6
    const roll = playerInput.roll * 2.4

    // Full 6DOF using incremental body-rate rotations on fwd + up (proper integration, no world-level reconstruction per frame).
    // This fixes pitch conflicts where "level" basis was causing background to appear to move in conflicting directions.
    let fwd = p.heading
    let upv = p.up   // local up

    // derive current right to match previous convention: cross(fwd, up) == right for our level case
    let right = normalize(cross(fwd, upv))

    // Yaw: rotate fwd and right around up (positive yaw turns right in our convention)
    if (Math.abs(yaw) > 0.001) {
      const rot = yaw * deltaSeconds
      fwd = this.rotateAroundAxis(fwd, upv, rot)
      right = this.rotateAroundAxis(right, upv, rot)
    }

    // Pitch: rotate fwd and up around right. Positive pitch lifts nose (consistent with E=up input).
    if (Math.abs(pitch) > 0.001) {
      const rot = pitch * deltaSeconds
      fwd = this.rotateAroundAxis(fwd, right, rot)
      upv = this.rotateAroundAxis(upv, right, rot)
    }

    // Roll: rotate right and up around fwd
    if (Math.abs(roll) > 0.001) {
      const rot = roll * deltaSeconds
      right = this.rotateAroundAxis(right, fwd, rot)
      upv = this.rotateAroundAxis(upv, fwd, rot)
    }

    // normalize and re-derive right to keep orthonormal + consistent handedness
    fwd = normalize(fwd)
    upv = normalize(upv)
    right = normalize(cross(fwd, upv))

    p.heading = fwd
    p.up = upv
    p.roll = (p.roll + roll * deltaSeconds) % (Math.PI * 2)  // keep scalar for radar banking etc.

    // thrust along heading
    const accel = scale(fwd, thrust * 38 * deltaSeconds)
    p.vel = add(p.vel, accel)
    p.vel = scale(p.vel, 0.986) // drag
    p.vel = clampMagnitude(p.vel, 52)
    p.pos = add(p.pos, scale(p.vel, deltaSeconds))
    p.speed = length(p.vel)

    // --- NPC flocking (Flocker logic) ---
    const cfg = this.config
    this.npcs = this.npcs.map((self) => {
      let accel = calculateFlocking(self, this.npcs, cfg)

      // mild attraction toward player for some roles (pirates & escorts)
      if (self.role === 'pirate' || self.role === 'escort') {
        const toPlayer = subtract(p.pos, self.pos)
        const dist = length(toPlayer)
        if (dist > 12 && dist < 180) {
          const attract = scale(normalize(toPlayer), (self.role === 'pirate' ? 0.6 : 0.35) * (1 - dist / 200))
          accel = add(accel, attract)
        }
      }

      const invMass = 1 / Math.max(0.3, self.mass)
      let vel = add(self.vel, scale(accel, cfg.accelScale * invMass))
      vel = scale(vel, cfg.drag)
      vel = clampMagnitude(vel, cfg.maxSpeed)

      const crowd = this.localPressure(self, 32)
      const contagion = this.localPressure(self, 55)
      const speed = length(vel)

      const pressure = Math.min(1, crowd * 0.3 + contagion * 0.45 + Math.min(0.4, speed / 30))

      const primary = addProgress(
        self.progress,
        self.orientation,
        self.flips,
        pressure * 0.9 + (self.role === 'pirate' ? 0.3 : 0)
      )

      const next: NpcAgent = {
        ...self,
        pos: add(self.pos, scale(vel, deltaSeconds)),
        vel,
        progress: primary.progress,
        orientation: primary.orientation,
        flips: primary.flips,
        crowdPressure: crowd,
        contagionPressure: contagion,
        pressure,
      }

      return applyRoleFeedback(next)
    })
  }

  private localPressure(self: NpcAgent, radius: number): number {
    let sum = 0
    let n = 0
    for (const o of this.npcs) {
      if (o.id === self.id) continue
      const d = length(subtract(o.pos, self.pos))
      if (d < radius) {
        sum += 1 - d / radius
        n++
      }
    }
    return n > 0 ? sum / n : 0
  }

  // Local axes are now provided by the shared getLocalAxes() in vector.ts (handles roll + full pitch correctly)

  private rotateAroundAxis(v: Vec3, axis: Vec3, angle: number): Vec3 {
    // Rodrigues' rotation formula (minimal)
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const dot = v.x * axis.x + v.y * axis.y + v.z * axis.z
    const cross = {
      x: axis.y * v.z - axis.z * v.y,
      y: axis.z * v.x - axis.x * v.z,
      z: axis.x * v.y - axis.y * v.x,
    }
    return {
      x: v.x * cos + cross.x * sin + axis.x * dot * (1 - cos),
      y: v.y * cos + cross.y * sin + axis.y * dot * (1 - cos),
      z: v.z * cos + cross.z * sin + axis.z * dot * (1 - cos),
    }
  }

  getSnapshot(): EliteSnapshot {
    const p = this.player
    return {
      player: {
        ...p,
        vel: { ...p.vel },
        heading: { ...p.heading },
        up: { ...p.up },
        pos: { ...p.pos },
        systemPos2d: { ...p.systemPos2d },
      },
      npcs: this.npcs.map(n => ({ ...n, pos: { ...n.pos }, vel: { ...n.vel } })),
      time: this.time,
    }
  }

  setFlightMode(mode: FlightMode) {
    this.player.flightMode = mode
  }

  performHyperspaceJump(destinationBodyId: string, fuelCost: number): boolean {
    if (this.player.fuel < fuelCost) return false
    const dest = getBodyById(destinationBodyId, 'frozen')
    if (!dest) return false

    this.player.fuel = Math.max(0, this.player.fuel - fuelCost)
    this.player.systemId = dest.systemId
    this.player.systemPos2d = { ...dest.pos2d }
    this.player.dockedAtStationId = dest.type === 'station' ? dest.id : null
    this.player.flightMode = 'normal'

    this.player.pos = {
      x: dest.pos3d.x * 0.02,
      y: 120,
      z: dest.pos3d.z * 0.02,
    }
    this.player.vel = zero()
    this.player.heading = { x: 0, y: 0, z: -1 }
    this.player.up = { x: 0, y: 1, z: 0 }
    this.player.roll = 0
    this.player.speed = 0
    return true
  }

  getFuel() {
    return this.player.fuel
  }
}
