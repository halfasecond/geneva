/** Minimum time the boot screen stays visible (cosmetic — not tied to real load progress). */
export const GAME_LOADING_MIN_MS = 3000

export type GameLoadingPhase = 'idle' | 'loading' | 'ready'

export interface GameLoadingState {
  phase: GameLoadingPhase
  /** Cosmetic 0–100; may reach 100 before real work finishes. */
  progress: number
  message: string
}

export const GAME_LOADING_MESSAGES = [
  'Syncing nav computer…',
  'Loading ship systems…',
  'Calibrating scanners…',
  'Connecting station network…',
  'Spooling flight controls…',
] as const

export type GameLoadingMessage = (typeof GAME_LOADING_MESSAGES)[number]