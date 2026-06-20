import type { DockBayIndex } from './dockBay'

/** Flight modes we persist — cutscene modes are normalized before save. */
export type PersistedFlightMode = 'normal' | 'supercruise' | 'docked'

export interface VechSaveVec2 {
  x: number
  y: number
}

export interface VechSaveVec3 {
  x: number
  y: number
  z: number
}

/** Persistable player blob — subset of elite/sim PlayerState + dock bay index. */
export interface VechSavePlayer {
  systemId: string
  flightMode: PersistedFlightMode
  dockedAtStationId: string | null
  /** Multi-bay stations only (e.g. Boreal 0/1); null elsewhere or in open flight. */
  dockBayIndex: DockBayIndex | null
  navReference2d: VechSaveVec2
  systemPos2d: VechSaveVec2
  pos: VechSaveVec3
  vel: VechSaveVec3
  heading: VechSaveVec3
  up: VechSaveVec3
  roll: number
  speed: number
  fuel: number
  credits: number
  cargo: Record<string, number>
  cargoCapacity: number
}

export const VECH_SAVE_VERSION = 1 as const

/** Per-hull progress document (wallet + tokenId unique on server). */
export interface VechSave {
  walletAddress: string
  tokenId: number
  player: VechSavePlayer
  version: typeof VECH_SAVE_VERSION
  /** Reserved for future centralized economy — not used in POC saves. */
  economySchemaVersion?: number
}