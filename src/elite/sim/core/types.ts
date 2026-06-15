export interface Vec3 {
  x: number
  y: number
  z: number
}

export interface SimConfig {
  separationRadius: number
  separationStrength: number
  cohesionRadius: number
  cohesionStrength: number
  alignmentRadius: number
  alignmentStrength: number
  maxSpeed: number
  accelScale: number
  drag: number
  k0: number // for kappa cohesion
  wallMargin?: number
  wallStrength?: number
}

export interface NpcAgent {
  id: number
  pos: Vec3
  vel: Vec3
  mass: number
  // BellToy / progress state (from Flocker logic)
  progress: number
  orientation: 1 | -1
  flips: number
  // diagnostics
  crowdPressure: number
  contagionPressure: number
  pressure: number
  // role for Elite behaviors
  role: 'trader' | 'pirate' | 'police' | 'escort'
}

export type FlightMode = 'normal' | 'supercruise' | 'hyperspace' | 'docked'

export interface PlayerState {
  pos: Vec3
  vel: Vec3
  heading: Vec3 // forward direction
  up: Vec3      // local up (for full 6DOF without world-level reconstruction)
  roll: number  // accumulated roll input (for radar banking etc, kept for compatibility)
  speed: number
  fuel: number
  systemId: string
  systemPos2d: { x: number; y: number }
  flightMode: FlightMode
  dockedAtStationId: string | null
}

export interface EliteSnapshot {
  player: PlayerState
  npcs: NpcAgent[]
  /** Local flight bubble time — unrelated to galaxy ephemeris */
  time: number
}
