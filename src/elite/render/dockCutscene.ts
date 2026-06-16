/**
 * Dock / undock pose tweens — short cinematic transitions into docked state.
 *
 * Live bay flow (see DOCK_LIVE):
 *   force-field proximity → dock_flyin filmed spline → market handoff
 * Bay door stays open; approach lights sequence on the hull only.
 */

import type { Vec3 } from '../sim/core/types'
import type { FlightPose } from '../sim/systemSpace'
import { DOCK, DOCK_LIVE } from '../config'

/** Phases for the always-open bay live cutscene (wired in EliteSim later). */
export type DockLivePhase = 'idle' | 'approach' | 'flyin' | 'through_field' | 'handoff'

export interface PoseTween {
  from: FlightPose
  to: FlightPose
  elapsed: number
  duration: number
}

export function createPoseTween(from: FlightPose, to: FlightPose, duration = DOCK.cutsceneDuration): PoseTween {
  return { from, to, elapsed: 0, duration }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function lerpVec3(a: Vec3, b: Vec3, t: number): Vec3 {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    z: lerp(a.z, b.z, t),
  }
}

function normalize(v: Vec3): Vec3 {
  const len = Math.hypot(v.x, v.y, v.z) || 1
  return { x: v.x / len, y: v.y / len, z: v.z / len }
}

function lerpHeading(from: Vec3, to: Vec3, t: number): Vec3 {
  return normalize(lerpVec3(from, to, t))
}

/** Advance tween by dt seconds; returns sampled pose and whether complete. */
export function stepPoseTween(tween: PoseTween, dt: number): { pose: FlightPose; done: boolean } {
  tween.elapsed = Math.min(tween.duration, tween.elapsed + dt)
  const t = tween.duration > 0 ? tween.elapsed / tween.duration : 1
  const ease = t * t * (3 - 2 * t) // smoothstep

  const pose: FlightPose = {
    pos: lerpVec3(tween.from.pos, tween.to.pos, ease),
    heading: lerpHeading(tween.from.heading, tween.to.heading, ease),
    up: lerpHeading(tween.from.up, tween.to.up, ease),
  }

  return { pose, done: tween.elapsed >= tween.duration }
}

export { DOCK_LIVE }