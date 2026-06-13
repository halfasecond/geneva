import type { NpcAgent } from './types'

// Simple BellToy-style progress stepper from Flocker exploration.
// Agents accumulate "pressure" and flip orientation on integer crossings.
// Useful for trader/pirate/patrol state changes.

export function addProgress(
  current: number,
  orientation: 1 | -1,
  flips: number,
  delta: number,
): { progress: number; orientation: 1 | -1; flips: number } {
  let p = current + delta * orientation
  let f = flips
  let o = orientation

  while (p >= 1) {
    p -= 1
    f += 1
    o = (o === 1 ? -1 : 1) as 1 | -1
  }
  while (p < 0) {
    p += 1
    f += 1
    o = (o === 1 ? -1 : 1) as 1 | -1
  }

  return { progress: p, orientation: o, flips: f }
}

export function applyRoleFeedback(agent: NpcAgent): NpcAgent {
  // Stub: later map role + pressure/orientation to different force tunings or behaviors
  // e.g. pirates get higher separation + aggression when orientation flips
  return agent
}
