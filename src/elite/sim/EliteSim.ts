import type { EliteSnapshot, FlightMode, NpcAgent, PlayerState, SimConfig, Vec3 } from './core/types'
import { add, clampMagnitude, cross, length, normalize, scale, subtract, zero } from './core/vector'
import { calculateFlocking } from './core/forces'
import { addProgress, applyRoleFeedback } from './core/progress'
import { DEFAULT_SPAWN_DESTINATION, getBodyById } from './cartography'
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
import type { PersistedFlightMode, VechSavePlayer } from '../../types/vechSave'
import { isBorealBayIndex } from '../../types/dockBay'
import { BIG_SHIP, BOREAL_STATION, DOCK, DOCK_LIVE, FUEL, LAND, MARKET, NPC } from '../config'
import { nearestLandableBody } from './landing'
import {
  borealDockedPose,
  borealFlyInStartPose,
  borealFreighterWorldPos,
  isBorealFreighterInBubble,
  borealUndockPose,
  distanceToBorealForceField,
  findBorealFreighter,
  nearestBorealBayIndex,
  nearestBorealDock,
  type DockBayIndex,
} from './borealDock'
import { BOREAL_BAY_STARBOARD } from '../../types/dockBay'
import {
  hyperspaceArrivalPose,
  stationApproachPose,
  surfaceLandingPose,
  surfaceTakeoffPose,
  stationDockedPose,
  systemPos2dFromLocal,
  type FlightPose,
  undockPose,
} from './systemSpace'
import { createPoseTween, stepPoseTween, type PoseTween } from '../render/dockCutscene'

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

function poseToPlayerFields(pose: FlightPose): Pick<PlayerState, 'pos' | 'heading' | 'up'> {
  return {
    pos: { ...pose.pos },
    heading: { ...pose.heading },
    up: { ...pose.up },
  }
}

export class EliteSim {
  private npcs: NpcAgent[] = []
  private player: PlayerState
  private config: SimConfig
  private marketConfig: MarketConfig
  private markets: MarketState[]
  private time = 0
  private poseTween: PoseTween | null = null
  private dockTargetId: string | null = null
  private landTargetId: string | null = null
  private dockBayIndex: DockBayIndex = BOREAL_BAY_STARBOARD
  private undockGraceUntil = 0

  constructor(ambientPopulation = NPC.ambientPopulation) {
    this.config = { ...DEFAULT_CONFIG }
    this.marketConfig = {
      ...defaultMarketConfig,
      timeScale: 1 / MARKET.hourIntervalSeconds,
    }
    this.markets = initMarkets()
    this.player = {} as PlayerState
    this.fromSave(EliteSim.defaultSave())
    this.resetNpcs(ambientPopulation)
  }

  /** Default spawn for a hull with no persisted progress. */
  static defaultSave(): VechSavePlayer {
    const spawnBody = getBodyById(DEFAULT_SPAWN_DESTINATION, 'frozen')
    const ref2d = { ...(spawnBody?.pos2d ?? { x: 0, y: 0 }) }
    const spawnPose = spawnBody
      ? hyperspaceArrivalPose(spawnBody)
      : { pos: { x: 0, y: 0, z: -120 }, heading: { x: 0, y: 0, z: 1 }, up: { x: 0, y: 1, z: 0 } }
    const poseFields = poseToPlayerFields(spawnPose)

    return {
      systemId: spawnBody?.systemId ?? 'helios',
      flightMode: 'normal',
      dockedAtStationId: null,
      dockBayIndex: null,
      navReference2d: ref2d,
      systemPos2d: { ...ref2d },
      pos: { ...poseFields.pos },
      vel: zero(),
      heading: { ...poseFields.heading },
      up: { ...poseFields.up },
      roll: 0,
      speed: 0,
      fuel: FUEL.starting,
      credits: MARKET.startingCredits,
      cargo: {},
      cargoCapacity: MARKET.cargoCapacity,
    }
  }

  toSave(): VechSavePlayer {
    const p = this.player
    const flightMode: PersistedFlightMode = p.dockedAtStationId
      ? 'docked'
      : p.flightMode === 'supercruise'
        ? 'supercruise'
        : 'normal'

    return {
      systemId: p.systemId,
      flightMode,
      dockedAtStationId: p.dockedAtStationId,
      dockBayIndex: p.dockedAtStationId === BOREAL_STATION.id ? this.dockBayIndex : null,
      navReference2d: { ...p.navReference2d },
      systemPos2d: { ...p.systemPos2d },
      pos: { ...p.pos },
      vel: { ...p.vel },
      heading: { ...p.heading },
      up: { ...p.up },
      roll: p.roll,
      speed: p.speed,
      fuel: p.fuel,
      credits: p.credits,
      cargo: { ...p.cargo },
      cargoCapacity: p.cargoCapacity,
    }
  }

  fromSave(save: VechSavePlayer): void {
    const flightMode: FlightMode = save.flightMode === 'docked' ? 'docked' : save.flightMode

    this.player = {
      systemId: save.systemId,
      flightMode,
      dockedAtStationId: save.dockedAtStationId,
      landedAtBodyId: null,
      navReference2d: { ...save.navReference2d },
      systemPos2d: { ...save.systemPos2d },
      pos: { ...save.pos },
      vel: { ...save.vel },
      heading: { ...save.heading },
      up: { ...save.up },
      roll: save.roll,
      speed: save.speed,
      fuel: save.fuel,
      credits: save.credits,
      cargo: { ...save.cargo },
      cargoCapacity: save.cargoCapacity,
    }

    if (save.dockBayIndex != null && isBorealBayIndex(save.dockBayIndex)) {
      this.dockBayIndex = save.dockBayIndex
    } else {
      this.dockBayIndex = BOREAL_BAY_STARBOARD
    }

    this.poseTween = null
    this.dockTargetId = null
    this.landTargetId = null
    this.undockGraceUntil = 0
    this.time = 0
    this.markets = initMarkets()
    this.syncSystemPos2d()
    this.syncBorealFreighter()
    this.resetNpcs()
  }

  private syncSystemPos2d() {
    this.player.systemPos2d = systemPos2dFromLocal(this.player.navReference2d, this.player.pos)
  }

  private syncBorealFreighter() {
    const freighter = findBorealFreighter(this.npcs)
    if (!freighter) return
    freighter.pos = { ...borealFreighterWorldPos(this.player.systemPos2d) }
    freighter.vel = { x: 0, y: 0, z: 0 }
  }

  resetNpcs(ambientCount = NPC.ambientPopulation) {
    this.npcs = []
    let nextId = 0
    const anchor = this.player.pos

    if (NPC.spawnBorealFreighter) {
      this.npcs.push({
        id: nextId++,
        pos: { ...borealFreighterWorldPos(this.player.systemPos2d) },
        vel: zero(),
        mass: 5.5,
        progress: 0,
        orientation: 1,
        flips: 0,
        crowdPressure: 0,
        contagionPressure: 0,
        pressure: 0,
        role: 'freighter',
        designation: BIG_SHIP.nameLabel.text,
      })
    }

    const roles: NpcAgent['role'][] = ['trader', 'pirate', 'police', 'escort', 'trader']
    for (let i = 0; i < ambientCount; i++) {
      const role = roles[i % roles.length]
      const angle = ambientCount > 0 ? (i / ambientCount) * Math.PI * 2 : 0
      const radius = 80 + (i % 5) * 12
      const speed = 1.5 + Math.random()
      this.npcs.push({
        id: nextId++,
        pos: {
          x: anchor.x + Math.cos(angle) * radius,
          y: anchor.y + Math.sin(angle) * radius * 0.06 + (i % 3 - 1) * 8,
          z: anchor.z + (Math.random() - 0.5) * 40,
        },
        vel: {
          x: -Math.sin(angle) * speed,
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
        role,
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

  /** Non-Boreal stations only — in range and slow enough for [F] dock. */
  getDockInvite(): { id: string; name: string } | null {
    const p = this.player
    if (p.flightMode !== 'normal' && p.flightMode !== 'supercruise') return null

    return nearestDockableStation(
      p.pos,
      p.systemPos2d,
      p.speed,
      DOCK.range,
      DOCK.maxApproachSpeed,
    )
  }

  /** Planets and moons only — in range and slow enough for [F] land. */
  getLandInvite(): { id: string; name: string; type: 'planet' | 'moon' } | null {
    const p = this.player
    if (p.flightMode !== 'normal' && p.flightMode !== 'supercruise') return null
    if (this.getDockInvite()) return null

    const invite = nearestLandableBody(
      p.systemPos2d,
      p.systemId,
      p.speed,
      LAND.range,
      LAND.maxApproachSpeed,
    )
    if (!invite) return null
    return { id: invite.id, name: invite.name, type: invite.type }
  }

  private getNearestDock() {
    const p = this.player
    const freighter = findBorealFreighter(this.npcs)
    if (freighter && isBorealFreighterInBubble(p.pos, freighter.pos)) {
      const boreal = nearestBorealDock(
        p.pos,
        freighter.pos,
        p.speed,
        BOREAL_STATION.maxApproachSpeed,
      )
      if (boreal) return boreal
    }
    return nearestDockableStation(p.pos, p.systemPos2d, p.speed, DOCK.range, DOCK.maxApproachSpeed)
  }

  private startBorealDockFlyIn(freighter: NpcAgent): boolean {
    const p = this.player
    const bayIndex = nearestBorealBayIndex(p.pos, freighter.pos)
    this.dockBayIndex = bayIndex
    const from = borealFlyInStartPose(p.pos, freighter.pos, bayIndex)
    const to = borealDockedPose(freighter.pos, bayIndex)
    this.dockTargetId = BOREAL_STATION.id
    this.poseTween = createPoseTween(from, to, DOCK_LIVE.flyInDuration)
    p.flightMode = 'dock_flyin'
    p.vel = zero()
    p.speed = 0
    return true
  }

  private tryAutoBorealDock() {
    const p = this.player
    if (p.flightMode !== 'normal') return
    if (this.time < this.undockGraceUntil) return

    const freighter = findBorealFreighter(this.npcs)
    if (!freighter || !isBorealFreighterInBubble(p.pos, freighter.pos)) return
    if (p.speed > BOREAL_STATION.maxApproachSpeed) return

    const dist = distanceToBorealForceField(p.pos, freighter.pos)
    if (dist > DOCK_LIVE.forceFieldTriggerRadius) return

    this.startBorealDockFlyIn(freighter)
  }

  /** Begin surface landing cutscene if in range and slow enough. */
  startLanding(): boolean {
    const p = this.player
    if (
      p.flightMode === 'landed'
      || p.flightMode === 'landing_in'
      || p.flightMode === 'takeoff'
    ) {
      return p.flightMode === 'landed'
    }
    if (p.flightMode !== 'normal' && p.flightMode !== 'supercruise') return false

    const invite = nearestLandableBody(
      p.systemPos2d,
      p.systemId,
      p.speed,
      LAND.range,
      LAND.maxApproachSpeed,
    )
    if (!invite || this.getDockInvite()) return false

    const body = getBodyById(invite.id, 'frozen')
    if (!body) return false

    const from: FlightPose = {
      pos: { ...p.pos },
      heading: { ...p.heading },
      up: { ...p.up },
    }
    const to = surfaceLandingPose(body, p.navReference2d)

    this.landTargetId = body.id
    this.poseTween = createPoseTween(from, to, LAND.cutsceneDuration)
    p.flightMode = 'landing_in'
    p.vel = zero()
    p.speed = 0
    return true
  }

  /** Body id for in-progress landing / takeoff cutscene (surface holo). */
  getLandingTargetId(): string | null {
    return this.landTargetId
  }

  /** Lift off from a landed body back to free flight. */
  startTakeoff(): boolean {
    const p = this.player
    if (p.flightMode !== 'landed' || !p.landedAtBodyId) return false

    const body = getBodyById(p.landedAtBodyId, 'frozen')
    if (!body) return false

    const from: FlightPose = {
      pos: { ...p.pos },
      heading: { ...p.heading },
      up: { ...p.up },
    }
    const to = surfaceTakeoffPose(body, p.navReference2d)

    this.landTargetId = p.landedAtBodyId
    this.poseTween = createPoseTween(from, to, LAND.cutsceneDuration)
    p.flightMode = 'takeoff'
    p.vel = zero()
    p.speed = 0
    return true
  }

  /** Begin dock cutscene if in range and slow enough. */
  startDocking(): boolean {
    const p = this.player
    if (
      p.flightMode === 'docked'
      || p.flightMode === 'docking_in'
      || p.flightMode === 'dock_flyin'
      || p.flightMode === 'undocking'
      || p.flightMode === 'landed'
      || p.flightMode === 'landing_in'
      || p.flightMode === 'takeoff'
    ) {
      return p.flightMode === 'docked'
    }

    const freighter = findBorealFreighter(this.npcs)
    const boreal = freighter && isBorealFreighterInBubble(p.pos, freighter.pos)
      ? nearestBorealDock(p.pos, freighter.pos, p.speed, BOREAL_STATION.maxApproachSpeed)
      : null

    if (boreal && freighter) {
      return this.startBorealDockFlyIn(freighter)
    }

    const nearest = nearestDockableStation(p.pos, p.systemPos2d, p.speed, DOCK.range, DOCK.maxApproachSpeed)
    if (!nearest) return false

    const body = getBodyById(nearest.id, 'frozen')
    if (!body) return false

    const from: FlightPose = {
      pos: { ...p.pos },
      heading: { ...p.heading },
      up: { ...p.up },
    }
    const to = stationApproachPose(body, p.navReference2d)

    this.dockTargetId = body.id
    this.poseTween = createPoseTween(from, to)
    p.flightMode = 'docking_in'
    p.vel = zero()
    p.speed = 0
    return true
  }

  /** Begin undock cutscene from docked state. */
  startUndocking(): boolean {
    const p = this.player
    if (p.flightMode !== 'docked' || !p.dockedAtStationId) return false

    let from: FlightPose = {
      pos: { ...p.pos },
      heading: { ...p.heading },
      up: { ...p.up },
    }
    let to: FlightPose

    if (p.dockedAtStationId === BOREAL_STATION.id) {
      const freighter = findBorealFreighter(this.npcs)
      if (!freighter) return false
      from = borealDockedPose(freighter.pos, this.dockBayIndex)
      to = borealUndockPose(freighter.pos, this.dockBayIndex)
    } else {
      const body = getBodyById(p.dockedAtStationId, 'frozen')
      if (!body) return false
      to = undockPose(body)
    }

    this.dockTargetId = null
    this.poseTween = createPoseTween(from, to)
    p.flightMode = 'undocking'
    p.vel = zero()
    p.speed = 0
    return true
  }

  private finishDocking() {
    const p = this.player
    const stationId = this.dockTargetId
    if (!stationId) {
      p.flightMode = 'normal'
      return
    }

    const body = getBodyById(stationId, 'frozen')
    if (!body) {
      p.flightMode = 'normal'
      return
    }

    p.navReference2d = { ...body.pos2d }
    if (stationId === BOREAL_STATION.id) {
      const freighter = findBorealFreighter(this.npcs)
      if (!freighter) {
        p.flightMode = 'normal'
        return
      }
      Object.assign(p, poseToPlayerFields(borealDockedPose(freighter.pos, this.dockBayIndex)))
    } else {
      const pose = stationDockedPose(body, p.navReference2d)
      Object.assign(p, poseToPlayerFields(pose))
    }
    this.syncSystemPos2d()
    p.dockedAtStationId = stationId
    p.flightMode = 'docked'
    p.vel = zero()
    p.speed = 0
    this.dockTargetId = null
    this.poseTween = null
  }

  private finishUndocking() {
    const p = this.player
    p.dockedAtStationId = null
    p.flightMode = 'normal'
    p.vel = scale(p.heading, DOCK.undockBoost)
    p.speed = DOCK.undockBoost
    this.undockGraceUntil = this.time + DOCK_LIVE.undockGraceSeconds
    this.poseTween = null
    this.syncSystemPos2d()
  }

  private finishLanding() {
    const p = this.player
    const bodyId = this.landTargetId
    if (!bodyId) {
      p.flightMode = 'normal'
      return
    }

    const body = getBodyById(bodyId, 'frozen')
    if (!body) {
      p.flightMode = 'normal'
      return
    }

    p.navReference2d = { ...body.pos2d }
    Object.assign(p, poseToPlayerFields(surfaceLandingPose(body, p.navReference2d)))
    this.syncSystemPos2d()
    p.landedAtBodyId = bodyId
    p.flightMode = 'landed'
    p.vel = zero()
    p.speed = 0
    this.landTargetId = null
    this.poseTween = null
  }

  private finishTakeoff() {
    const p = this.player
    p.landedAtBodyId = null
    p.flightMode = 'normal'
    p.vel = scale(p.heading, LAND.takeoffBoost)
    p.speed = LAND.takeoffBoost
    this.landTargetId = null
    this.poseTween = null
    this.syncSystemPos2d()
  }

  private stepPoseCutscene(deltaSeconds: number) {
    if (!this.poseTween) return

    const { pose, done } = stepPoseTween(this.poseTween, deltaSeconds)
    const p = this.player
    p.pos = pose.pos
    p.heading = pose.heading
    p.up = pose.up
    p.vel = zero()
    p.speed = 0
    this.syncSystemPos2d()

    if (!done) return

    if (p.flightMode === 'docking_in' || p.flightMode === 'dock_flyin') this.finishDocking()
    else if (p.flightMode === 'undocking') this.finishUndocking()
    else if (p.flightMode === 'landing_in') this.finishLanding()
    else if (p.flightMode === 'takeoff') this.finishTakeoff()
  }

  tryDock(): boolean {
    return this.startDocking()
  }

  undock(): void {
    this.startUndocking()
  }

  toggleDock(): boolean {
    if (this.player.flightMode === 'landed') {
      return this.startTakeoff()
    }
    if (this.player.flightMode === 'docked') {
      this.startUndocking()
      return true
    }
    if (this.getDockInvite()) return this.startDocking()
    return this.startLanding()
  }

  refuel(): boolean {
    const p = this.player
    if (p.flightMode !== 'docked' || p.fuel >= FUEL.max) return false
    p.fuel = FUEL.max
    return true
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

    if (
      p.flightMode === 'docking_in'
      || p.flightMode === 'dock_flyin'
      || p.flightMode === 'undocking'
      || p.flightMode === 'landing_in'
      || p.flightMode === 'takeoff'
    ) {
      this.stepPoseCutscene(deltaSeconds)
      this.stepNpcs(deltaSeconds)
      return
    }

    if (p.flightMode === 'landed') {
      p.vel = zero()
      p.speed = 0
      this.applyAttitudeFromInput(p, playerInput, deltaSeconds)
      this.stepNpcs(deltaSeconds)
      return
    }

    if (p.flightMode === 'docked') {
      p.vel = zero()
      p.speed = 0
      this.applyAttitudeFromInput(p, playerInput, deltaSeconds)
      this.stepNpcs(deltaSeconds)
      return
    }

    this.applyAttitudeFromInput(p, playerInput, deltaSeconds)

    const thrust = Math.max(-0.6, Math.min(1.6, playerInput.thrust))
    const fwd = p.heading
    const accel = scale(fwd, thrust * 38 * deltaSeconds)
    p.vel = add(p.vel, accel)
    p.vel = scale(p.vel, 0.986)
    p.vel = clampMagnitude(p.vel, 52)
    p.pos = add(p.pos, scale(p.vel, deltaSeconds))
    p.speed = length(p.vel)
    this.syncSystemPos2d()
    this.syncBorealFreighter()

    this.tryAutoBorealDock()

    this.stepNpcs(deltaSeconds)
  }

  /** Yaw / pitch / roll only — used in flight and while docked (look around). */
  private applyAttitudeFromInput(
    p: PlayerState,
    playerInput: { yaw: number; pitch: number; roll: number },
    deltaSeconds: number,
  ) {
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

    p.heading = normalize(fwd)
    p.up = normalize(upv)
    p.roll = (p.roll + roll * deltaSeconds) % (Math.PI * 2)
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

  private rotateAroundAxis(v: Vec3, axis: Vec3, angle: number): Vec3 {
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
        navReference2d: { ...p.navReference2d },
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
      nearestDock: this.getNearestDock(),
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
    this.player.navReference2d = { ...dest.pos2d }
    this.player.dockedAtStationId = null
    this.player.landedAtBodyId = null
    this.player.flightMode = 'normal'

    const pose = hyperspaceArrivalPose(dest)
    Object.assign(this.player, poseToPlayerFields(pose))
    this.syncSystemPos2d()
    this.player.vel = zero()
    this.player.roll = 0
    this.player.speed = 0
    this.poseTween = null
    this.dockTargetId = null
    this.landTargetId = null
    this.syncBorealFreighter()
    return true
  }

  getFuel() {
    return this.player.fuel
  }
}