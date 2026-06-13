import type { NpcAgent, PlayerState, SimConfig, Vec3 } from './core/types'
import { add, clampMagnitude, length, normalize, scale, subtract, zero } from './core/vector'
import { calculateFlocking } from './core/forces'
import { addProgress, applyRoleFeedback } from './core/progress'

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
    this.player = {
      pos: { x: 0, y: 120, z: 40 },
      vel: { x: 0, y: 0, z: -6 },
      heading: { x: 0, y: 0, z: -1 },
      roll: 0,
      speed: 6,
      fuel: 120,
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

    // Simple heading update (torque style)
    const right = this.getRightVector(p.heading, p.roll)
    const up = this.getUpVector(p.heading, p.roll)

    let newHeading = p.heading
    // yaw around up
    if (Math.abs(yaw) > 0.001) {
      const rot = yaw * deltaSeconds
      newHeading = this.rotateAroundAxis(newHeading, up, rot)
    }
    // pitch around right
    if (Math.abs(pitch) > 0.001) {
      const rot = pitch * deltaSeconds
      newHeading = this.rotateAroundAxis(newHeading, right, rot)
    }

    newHeading = normalize(newHeading)
    p.heading = newHeading
    p.roll = (p.roll + roll * deltaSeconds) % (Math.PI * 2)

    // thrust along heading
    const accel = scale(newHeading, thrust * 38 * deltaSeconds)
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

  private getRightVector(heading: Vec3, roll: number): Vec3 {
    // Approximate right from heading + roll (simplified)
    const right = { x: -heading.z, y: 0, z: heading.x } // rough
    return normalize(right)
  }

  private getUpVector(heading: Vec3, roll: number): Vec3 {
    const right = this.getRightVector(heading, roll)
    // cross product heading x right for "up"
    return normalize({
      x: heading.y * right.z - heading.z * right.y,
      y: heading.z * right.x - heading.x * right.z,
      z: heading.x * right.y - heading.y * right.x,
    })
  }

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

  getSnapshot(): { player: PlayerState; npcs: NpcAgent[]; time: number } {
    return {
      player: { ...this.player, vel: { ...this.player.vel }, heading: { ...this.player.heading }, pos: { ...this.player.pos } },
      npcs: this.npcs.map(n => ({ ...n, pos: { ...n.pos }, vel: { ...n.vel } })),
      time: this.time,
    }
  }

  // Hyperspace jump support (fuel + teleport)
  performHyperspace(targetPos: Vec3, fuelCost: number): boolean {
    if (this.player.fuel < fuelCost) return false
    this.player.pos = { ...targetPos }
    this.player.vel = zero()
    this.player.fuel = Math.max(0, this.player.fuel - fuelCost)
    // Face roughly "forward" after arrival
    this.player.heading = { x: 0, y: 0, z: -1 }
    this.player.roll = 0
    this.player.speed = 0
    return true
  }

  getFuel() {
    return this.player.fuel
  }
}
