import type { EliteSnapshot, FlightMode, NpcAgent, PlayerState, SimConfig } from './core/types'
import { add, clampMagnitude, cross, length, normalize, scale, subtract, zero } from './core/vector'
import { calculateFlocking } from './core/forces'
import { addProgress, applyRoleFeedback } from './core/progress'
import { getBodyById, DEFAULT_ROUTE, navPos3dFromBody } from './cartography'
import {
  applyPlayerTrade,
  defaultMarketConfig,
  getCargoUsed,
  getMarketDiagnostics,
  initMarkets,
  nearestDockableStation,
  stepMarkets,
  type MarketConfig,
  type MarketState,
} from './market'
import { DOCK, MARKET } from '../config'

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
  private marketConfig: MarketConfig
  private markets: MarketState[]
  private time = 0

  constructor(initialPopulation = 2) {
    this.config = { ...DEFAULT_CONFIG }
    this.marketConfig = {
      ...defaultMarketConfig,
      timeScale: 1 / MARKET.hourIntervalSeconds,
    }
    this.markets = initMarkets()
    const origin = getBodyById(DEFAULT_ROUTE.originId, 'frozen')
    const spawn = origin ? navPos3dFromBody(origin) : { x: 0, y: 120, z: 40 }
    this.player = {
      pos: spawn,
      vel: { x: 0, y: 0, z: -6 },
      heading: { x: 0, y: 0, z: -1 },
      up: { x: 0, y: 1, z: 0 },
      roll: 0,
      speed: 6,
      fuel: 120,
      credits: MARKET.startingCredits,
      cargo: {},
      cargoCapacity: MARKET.cargoCapacity,
      systemId: origin?.systemId ?? 'helios',
      systemPos2d: { ...(origin?.pos2d ?? { x: 0, y: 0 }) },
      flightMode: 'normal',
      dockedAtStationId: null,
    }
    this.resetNpcs(initialPopulation)
    if (origin?.type === 'station') {
      this.player.flightMode = 'docked'
      this.player.dockedAtStationId = origin.id
      this.player.vel = zero()
      this.player.speed = 0
    }
  }

  resetNpcs(count: number) {
    this.npcs = []
    const roles: NpcAgent['role'][] = ['trader', 'trader', 'pirate', 'police', 'escort', 'trader']
    const anchor = this.player.pos

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const radius = 80 + (i % 5) * 12
      this.npcs.push({
        id: i,
        pos: {
          x: anchor.x + Math.cos(angle) * radius,
          y: anchor.y + Math.sin(angle) * radius * 0.06 + (i % 3 - 1) * 8,
          z: anchor.z + (Math.random() - 0.5) * 40,
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

  getMarkets() {
    return this.markets
  }

  getDockedMarket(): MarketState | null {
    const id = this.player.dockedAtStationId
    if (!id) return null
    return this.markets.find(m => m.id === id) ?? null
  }

  tryDock(): boolean {
    if (this.player.flightMode === 'docked') return true
    const nearest = nearestDockableStation(this.player.pos, DOCK.range)
    if (!nearest) return false

    const body = getBodyById(nearest.id, 'frozen')
    if (!body) return false

    this.player.dockedAtStationId = nearest.id
    this.player.flightMode = 'docked'
    this.player.pos = navPos3dFromBody(body)
    this.player.vel = zero()
    this.player.speed = 0
    this.player.systemPos2d = { ...body.pos2d }
    return true
  }

  undock(): void {
    if (this.player.flightMode !== 'docked') return
    this.player.dockedAtStationId = null
    this.player.flightMode = 'normal'
    this.player.vel = scale(this.player.heading, 4)
    this.player.speed = 4
  }

  toggleDock(): boolean {
    if (this.player.flightMode === 'docked') {
      this.undock()
      return true
    }
    return this.tryDock()
  }

  tradeCommodity(commodityId: string, tons: number, direction: 'buy' | 'sell'): boolean {
    const stationId = this.player.dockedAtStationId
    if (!stationId || this.player.flightMode !== 'docked') return false
    if (tons <= 0) return false

    const marketIndex = this.markets.findIndex(m => m.id === stationId)
    if (marketIndex < 0) return false

    const market = this.markets[marketIndex]
    const listing = market.commodities[commodityId]
    if (!listing) return false

    if (direction === 'buy') {
      const cost = listing.price * tons
      const cargoUsed = getCargoUsed(this.player.cargo)
      if (this.player.credits < cost) return false
      if (cargoUsed + tons > this.player.cargoCapacity) return false
      if (listing.stock < tons) return false

      this.player.credits -= cost
      this.player.cargo[commodityId] = (this.player.cargo[commodityId] ?? 0) + tons
    } else {
      const held = this.player.cargo[commodityId] ?? 0
      if (held < tons) return false
      this.player.credits += listing.price * tons
      const next = held - tons
      if (next <= 0) delete this.player.cargo[commodityId]
      else this.player.cargo[commodityId] = next
    }

    this.markets[marketIndex] = applyPlayerTrade(market, commodityId, tons, direction)
    return true
  }

  step(deltaSeconds: number, playerInput: { thrust: number; yaw: number; pitch: number; roll: number }) {
    this.time += deltaSeconds
    this.markets = stepMarkets(this.markets, this.time, this.marketConfig)

    const p = this.player
    if (p.flightMode === 'docked') {
      p.vel = zero()
      p.speed = 0
      this.stepNpcs(deltaSeconds)
      return
    }

    const thrust = Math.max(-0.6, Math.min(1.6, playerInput.thrust))
    const yaw = playerInput.yaw * 1.8
    const pitch = playerInput.pitch * 1.6
    const roll = playerInput.roll * 2.4

    let fwd = p.heading
    let upv = p.up
    let right = normalize(cross(fwd, upv))

    if (Math.abs(yaw) > 0.001) {
      const rot = yaw * deltaSeconds
      fwd = this.rotateAroundAxis(fwd, upv, rot)
      right = this.rotateAroundAxis(right, upv, rot)
    }

    if (Math.abs(pitch) > 0.001) {
      const rot = pitch * deltaSeconds
      fwd = this.rotateAroundAxis(fwd, right, rot)
      upv = this.rotateAroundAxis(upv, right, rot)
    }

    if (Math.abs(roll) > 0.001) {
      const rot = roll * deltaSeconds
      right = this.rotateAroundAxis(right, fwd, rot)
      upv = this.rotateAroundAxis(upv, fwd, rot)
    }

    fwd = normalize(fwd)
    upv = normalize(upv)
    right = normalize(cross(fwd, upv))

    p.heading = fwd
    p.up = upv
    p.roll = (p.roll + roll * deltaSeconds) % (Math.PI * 2)

    const accel = scale(fwd, thrust * 38 * deltaSeconds)
    p.vel = add(p.vel, accel)
    p.vel = scale(p.vel, 0.986)
    p.vel = clampMagnitude(p.vel, 52)
    p.pos = add(p.pos, scale(p.vel, deltaSeconds))
    p.speed = length(p.vel)

    this.stepNpcs(deltaSeconds)
  }

  private stepNpcs(deltaSeconds: number) {
    const p = this.player
    const cfg = this.config
    this.npcs = this.npcs.map((self) => {
      let accel = calculateFlocking(self, this.npcs, cfg)

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

  private rotateAroundAxis(v: { x: number; y: number; z: number }, axis: { x: number; y: number; z: number }, angle: number) {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const dot = v.x * axis.x + v.y * axis.y + v.z * axis.z
    const crossProd = {
      x: axis.y * v.z - axis.z * v.y,
      y: axis.z * v.x - axis.x * v.z,
      z: axis.x * v.y - axis.y * v.x,
    }
    return {
      x: v.x * cos + crossProd.x * sin + axis.x * dot * (1 - cos),
      y: v.y * cos + crossProd.y * sin + axis.y * dot * (1 - cos),
      z: v.z * cos + crossProd.z * sin + axis.z * dot * (1 - cos),
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
        cargo: { ...p.cargo },
      },
      npcs: this.npcs.map(n => ({ ...n, pos: { ...n.pos }, vel: { ...n.vel } })),
      time: this.time,
      markets: this.markets.map(m => ({
        ...m,
        commodities: Object.fromEntries(
          Object.entries(m.commodities).map(([id, c]) => [id, { ...c, candles: [...c.candles] }]),
        ),
      })),
      marketDiagnostics: getMarketDiagnostics(this.markets),
      nearestDock: nearestDockableStation(p.pos, DOCK.range),
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
    this.player.flightMode = dest.type === 'station' ? 'docked' : 'normal'

    this.player.pos = navPos3dFromBody(dest)
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