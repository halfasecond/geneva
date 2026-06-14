/**
 * useFlightInput
 * Extracted keyboard handling (Elite classic: W/S thrust, A/D yaw, Q/E pitch, Z/X roll).
 * Returns a stable getter you can call every frame from the render/animate loop.
 * Also exposes the raw keys ref if a consumer needs it (e.g. for 'm'/'h' toggles that live in the orchestrator).
 */

import { useCallback, useEffect, useRef } from 'react'

export interface FlightInput {
  thrust: number
  yaw: number
  pitch: number
  roll: number
}

export function useFlightInput() {
  const keysRef = useRef<Record<string, boolean>>({})

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    const k = e.key.toLowerCase()
    const c = e.code.toLowerCase()
    keysRef.current[k] = true
    keysRef.current[c] = true

    // Prevent page scroll on the classic control keys
    if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) {
      e.preventDefault()
    }
  }, [])

  const onKeyUp = useCallback((e: KeyboardEvent) => {
    const k = e.key.toLowerCase()
    const c = e.code.toLowerCase()
    keysRef.current[k] = false
    keysRef.current[c] = false
  }, [])

  // Attach once (global keyboard is fine for a full-screen cockpit)
  useEffect(() => {
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [onKeyDown, onKeyUp])

  const getInput = useCallback((): FlightInput => {
    const k = keysRef.current
    let thrust = 0
    let yaw = 0
    let pitch = 0
    let roll = 0

    if (k['w'] || k['arrowup']) thrust += 1
    if (k['s'] || k['arrowdown']) thrust -= 0.7

    if (k['a'] || k['arrowleft']) yaw -= 1
    if (k['d'] || k['arrowright']) yaw += 1

    if (k['q']) pitch = -1
    if (k['e']) pitch = 1

    if (k['z']) roll -= 1
    if (k['x']) roll += 1

    return { thrust, yaw, pitch, roll }
  }, [])

  // Expose for the handful of global keys that the orchestrator still cares about (m, h, r)
  const isKeyDown = useCallback((key: string) => !!keysRef.current[key.toLowerCase()], [])

  return { getInput, isKeyDown, keysRef }
}
