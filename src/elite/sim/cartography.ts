// Galaxy + system cartography.
// Positions are deterministic from GALAXY_EPOCH_UNIX so all clients (and future server) agree.
// Local flight sim time is unrelated — see getGalaxyElapsedSeconds() vs EliteSim.time.
//
// pos2d is authoritative for the orbital plane. pos3d is a catalog local position (star at origin).
// Live 3D/radar positions use systemSpace.bodyLocalPos(body, player.systemPos2d).

import { FUEL } from '../config'
import { approachPose, catalogLocalPos } from './systemSpace'

export interface StarSystem {
  id: string
  name: string
  /** Fixed galactic position (light-years). Stars do not drift at game timescales. */
  xLy: number
  yLy: number
  zLy: number
}

export interface CartographyBody {
  id: string
  name: string
  systemId: string
  type: 'star' | 'planet' | 'moon' | 'station'
  color: string
  radius: number
  orbitRadius: number
  parentId?: string
  pos2d: { x: number; y: number }
  pos3d: { x: number; y: number; z: number }
  government?: string
  sector?: string
  navOnly?: boolean
}

/** Shared epoch — replace with server-published value in Phase 3 */
export const GALAXY_EPOCH_UNIX = 1735689600 // 2025-01-01T00:00:00Z

export const STAR_SYSTEMS: Record<string, StarSystem> = {
  helios: { id: 'helios', name: 'Helios', xLy: 0, yLy: 0, zLy: 0 },
  vega: { id: 'vega', name: 'Vega Reach', xLy: 6.23, yLy: 1.8, zLy: 0 },
}

export const GALAXY_SYSTEM_ORDER = Object.keys(STAR_SYSTEMS)

type BodyPreset = {
  id: string
  name: string
  systemId: string
  type: CartographyBody['type']
  color: string
  radius: number
  orbitRadius: number
  parentId?: string
  angleAtEpoch: number
  eccentricity?: number
  orbitalPeriodSeconds: number
  mapOrbitPeriodSeconds?: number
  government?: string
  sector?: string
  /** Map/hyperspace anchor only — no 3D mesh or spatial radar (BOREAL hull is the dock). */
  navOnly?: boolean
}

const bodyPresets: BodyPreset[] = [
  { id: 'helios', name: 'Helios', systemId: 'helios', type: 'star', color: '#ffe6a3', radius: 13, orbitRadius: 0, angleAtEpoch: 0, orbitalPeriodSeconds: 0 },
  { id: 'aster', name: 'Aster Prime', systemId: 'helios', type: 'planet', color: '#62d6ff', radius: 6, orbitRadius: 145, angleAtEpoch: 0.35, eccentricity: 0.04, parentId: 'helios', orbitalPeriodSeconds: 86400 * 420, mapOrbitPeriodSeconds: 900 },
  { id: 'aster-moon', name: 'Lark', systemId: 'helios', type: 'moon', color: '#ccd5dd', radius: 2.7, orbitRadius: 25, angleAtEpoch: 1.2, eccentricity: 0.08, parentId: 'aster', orbitalPeriodSeconds: 86400 * 28, mapOrbitPeriodSeconds: 240 },
  { id: 'aster-hub', name: 'Aster Hub', systemId: 'helios', type: 'station', color: '#9be7c1', radius: 2.2, orbitRadius: 36, angleAtEpoch: 3.75, eccentricity: 0.02, parentId: 'aster', orbitalPeriodSeconds: 0, government: 'Corporate', sector: 'Helios Core' },
  { id: 'cinder', name: 'Cinder', systemId: 'helios', type: 'planet', color: '#ff9f72', radius: 5.2, orbitRadius: 225, angleAtEpoch: 2.2, eccentricity: 0.08, parentId: 'helios', orbitalPeriodSeconds: 86400 * 680, mapOrbitPeriodSeconds: 1200 },
  { id: 'cinder-exchange', name: 'Cinder Exchange', systemId: 'helios', type: 'station', color: '#d8fff0', radius: 2.4, orbitRadius: 34, angleAtEpoch: 5.1, eccentricity: 0.05, parentId: 'cinder', orbitalPeriodSeconds: 0, government: 'Independent', sector: 'Helios Belt' },
  { id: 'helio-port', name: 'Helio Port', systemId: 'helios', type: 'station', color: '#fff3c4', radius: 2.5, orbitRadius: 94, angleAtEpoch: 0.18, eccentricity: 0.12, parentId: 'helios', orbitalPeriodSeconds: 0, government: 'Corporate', sector: 'Helios Core' },
  { id: 'boreal', name: 'Boreal', systemId: 'helios', type: 'planet', color: '#6ce6ff', radius: 8, orbitRadius: 320, angleAtEpoch: 4.45, eccentricity: 0.06, parentId: 'helios', orbitalPeriodSeconds: 86400 * 2200, mapOrbitPeriodSeconds: 1800 },
  { id: 'boreal-moon', name: 'Vela', systemId: 'helios', type: 'moon', color: '#cdd7ff', radius: 3, orbitRadius: 38, angleAtEpoch: 0.9, eccentricity: 0.1, parentId: 'boreal', orbitalPeriodSeconds: 86400 * 42, mapOrbitPeriodSeconds: 360 },
  { id: 'boreal-station', name: 'Boreal Station', systemId: 'helios', type: 'station', color: '#d7fff1', radius: 2.3, orbitRadius: 55, angleAtEpoch: 5.6, eccentricity: 0.03, parentId: 'boreal', orbitalPeriodSeconds: 0, government: 'Anarchy', sector: 'Helios Outer', navOnly: true },
]

/** Bodies that exist for map/routes/markets only — never rendered or scanned spatially. */
export function isNavOnlyCartographyBody(body: Pick<CartographyBody, 'id' | 'navOnly'>): boolean {
  return !!body.navOnly
}

/** Static catalog for origin/destination lists (IDs + names) */
export const CARTOGRAPHY_BODIES = bodyPresets

export type CartographyTimeMode = 'frozen' | 'map' | 'ephemeris'

export function getGalaxyElapsedSeconds(): number {
  return Date.now() / 1000 - GALAXY_EPOCH_UNIX
}

function orbitAngle(preset: BodyPreset, elapsedSeconds: number, mode: CartographyTimeMode): number {
  if (preset.orbitalPeriodSeconds <= 0) return preset.angleAtEpoch

  if (mode === 'frozen') return preset.angleAtEpoch

  const period = mode === 'map' && preset.mapOrbitPeriodSeconds
    ? preset.mapOrbitPeriodSeconds
    : preset.orbitalPeriodSeconds

  return preset.angleAtEpoch + (2 * Math.PI * elapsedSeconds) / period
}

export function getCartographyBodies(
  elapsedSeconds: number = 0,
  mode: CartographyTimeMode = 'frozen',
): CartographyBody[] {
  const positioned = new Map<string, { x: number; y: number }>()
  const result: CartographyBody[] = []

  for (const preset of bodyPresets) {
    const parentPos = preset.parentId ? positioned.get(preset.parentId) : { x: 0, y: 0 }
    const angle = orbitAngle(preset, elapsedSeconds, mode)
    const ecc = preset.eccentricity ?? 0
    const xR = preset.orbitRadius
    const yR = preset.orbitRadius * (1 - ecc)

    const relX = Math.cos(angle) * xR
    const relY = Math.sin(angle) * yR

    const x = preset.type === 'star' ? 0 : (parentPos?.x ?? 0) + relX
    const y = preset.type === 'star' ? 0 : (parentPos?.y ?? 0) + relY

    positioned.set(preset.id, { x, y })

    const pos2d = { x, y }
    const pos3d = catalogLocalPos({
      id: preset.id,
      type: preset.type,
      pos2d,
    })

    result.push({
      id: preset.id,
      name: preset.name,
      systemId: preset.systemId,
      type: preset.type,
      color: preset.color,
      radius: preset.radius,
      orbitRadius: preset.orbitRadius,
      parentId: preset.parentId,
      pos2d,
      pos3d,
      government: preset.government,
      sector: preset.sector,
      navOnly: preset.navOnly,
    })
  }

  return result
}

export function getFrozenCartographyBodies(): CartographyBody[] {
  return getCartographyBodies(0, 'frozen')
}

export function getMapCartographyBodies(): CartographyBody[] {
  return getCartographyBodies(getGalaxyElapsedSeconds(), 'map')
}

export function getBodyById(id: string | null | undefined, mode: CartographyTimeMode = 'frozen') {
  if (!id) return undefined
  const elapsed = mode === 'map' ? getGalaxyElapsedSeconds() : 0
  return getCartographyBodies(elapsed, mode).find(b => b.id === id)
}

export function getDistance2D(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

/** Player spawn / sim default — not the cartography UI selection. */
export const DEFAULT_SPAWN_DESTINATION = 'boreal-station'

export interface RouteSelection {
  destinationId: string | null
}

export const EMPTY_ROUTE: RouteSelection = { destinationId: null }

/** @deprecated Use DEFAULT_SPAWN_DESTINATION for sim spawn, EMPTY_ROUTE for UI. */
export const DEFAULT_ROUTE = { destinationId: DEFAULT_SPAWN_DESTINATION }

export interface TravelDistance {
  label: string
  au: number | null
  ly: number | null
  sameSystem: boolean
}

export const MAP_UNIT_TO_AU = 0.08

export function getSystemDistanceAu(from: { x: number; y: number }, to: { x: number; y: number }) {
  return getDistance2D(from, to) * MAP_UNIT_TO_AU
}

export function getInterSystemDistanceLy(systemAId: string, systemBId: string) {
  const a = STAR_SYSTEMS[systemAId]
  const b = STAR_SYSTEMS[systemBId]
  if (!a || !b) return null
  return Math.hypot(b.xLy - a.xLy, b.yLy - a.yLy, b.zLy - a.zLy)
}

export function getTravelDistanceFrom(
  from: { x: number; y: number },
  fromSystemId: string,
  destId: string | null | undefined,
  mode: CartographyTimeMode = 'frozen',
): TravelDistance | null {
  const dest = getBodyById(destId, mode)
  if (!dest) return null

  if (fromSystemId !== dest.systemId) {
    const ly = getInterSystemDistanceLy(fromSystemId, dest.systemId)
    if (ly === null) return null
    return { label: `${ly.toFixed(2)} Ly`, au: null, ly, sameSystem: false }
  }

  const au = getSystemDistanceAu(from, dest.pos2d)
  return {
    label: au < 0.01 ? `${(au * 149597870.7).toFixed(0)} km` : `${au.toFixed(2)} AU`,
    au,
    ly: null,
    sameSystem: true,
  }
}

export function getJumpFuelCost(
  from: { x: number; y: number },
  to: { x: number; y: number },
  fromSystemId: string,
  toSystemId: string,
) {
  const { jump } = FUEL
  if (fromSystemId !== toSystemId) {
    const ly = getInterSystemDistanceLy(fromSystemId, toSystemId)
    if (ly === null) return Infinity
    return Math.round(jump.interSystemBase + ly * jump.interSystemPerLy)
  }
  const au = getSystemDistanceAu(from, to)
  return Math.round(jump.sameSystemBase + au * jump.sameSystemPerAu)
}

export function getRouteJumpCost(
  from: { x: number; y: number },
  fromSystemId: string,
  route: RouteSelection,
  mode: CartographyTimeMode = 'frozen',
) {
  if (!route.destinationId) return Infinity
  const dest = getBodyById(route.destinationId, mode)
  if (!dest) return Infinity
  return getJumpFuelCost(from, dest.pos2d, fromSystemId, dest.systemId)
}

export function canInitiateHyperspace(opts: {
  destinationId: string | null
  flightMode: string
  fuel: number
  cost: number
  isHyperspacing: boolean
}): boolean {
  if (!opts.destinationId || opts.isHyperspacing || opts.flightMode === 'docked') return false
  if (!Number.isFinite(opts.cost) || opts.fuel < opts.cost) return false
  return Boolean(getBodyById(opts.destinationId, 'frozen'))
}

/** @deprecated Use systemSpace.approachPose / dockedPose / arrivalPose */
export function navPos3dFromBody(body: CartographyBody): { x: number; y: number; z: number } {
  return approachPose(body).pos
}