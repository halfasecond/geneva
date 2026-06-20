/**
 * Numeric dock bay indices — used in saves and sim state instead of string sides.
 * Boreal freighter: two bays on the hull (expandable pattern for other stations later).
 */

export type DockBayIndex = number

/** Boreal capital freighter — starboard approach bay. */
export const BOREAL_BAY_STARBOARD = 0

/** Boreal capital freighter — port approach bay. */
export const BOREAL_BAY_PORT = 1

export const BOREAL_BAY_COUNT = 2

export function isBorealBayIndex(index: number): index is typeof BOREAL_BAY_STARBOARD | typeof BOREAL_BAY_PORT {
  return index === BOREAL_BAY_STARBOARD || index === BOREAL_BAY_PORT
}

/** Human-readable label for HUD / debug (Bay 0, Bay 1). */
export function dockBayLabel(stationId: string | null | undefined, bayIndex: number | null | undefined): string | null {
  if (bayIndex == null || bayIndex < 0) return null
  if (stationId === 'boreal-station') {
    return `Bay ${bayIndex}`
  }
  return `Bay ${bayIndex}`
}