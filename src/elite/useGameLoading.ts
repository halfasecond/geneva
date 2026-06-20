import { useEffect, useRef, useState } from 'react'
import {
  GAME_LOADING_MESSAGES,
  GAME_LOADING_MIN_MS,
  type GameLoadingPhase,
  type GameLoadingState,
} from '../types/gameLoading'

const TICK_MS = 50

/**
 * Cosmetic boot progress — always runs at least GAME_LOADING_MIN_MS before ready.
 * Optional async work can finish earlier; the bar still animates until min elapsed.
 */
export function useGameLoading(active: boolean, run?: () => Promise<void>) {
  const [state, setState] = useState<GameLoadingState>({
    phase: 'idle',
    progress: 0,
    message: GAME_LOADING_MESSAGES[0],
  })
  const workDoneRef = useRef(true)
  const runRef = useRef(run)
  runRef.current = run

  useEffect(() => {
    if (!active) {
      setState({ phase: 'idle', progress: 0, message: GAME_LOADING_MESSAGES[0] })
      return
    }

    let cancelled = false
    let tick: ReturnType<typeof setInterval> | undefined
    const startedAt = performance.now()
    workDoneRef.current = false

    setState({ phase: 'loading', progress: 0, message: GAME_LOADING_MESSAGES[0] })

    const work = runRef.current?.() ?? Promise.resolve()
    work
      .catch((err) => console.error('Game load task failed:', err))
      .finally(() => { workDoneRef.current = true })

    let msgIndex = 0
    tick = setInterval(() => {
      if (cancelled) return
      const elapsed = performance.now() - startedAt
      const timeProgress = Math.min(100, (elapsed / GAME_LOADING_MIN_MS) * 100)
      const eased = timeProgress < 92
        ? timeProgress
        : 92 + (timeProgress - 92) * (workDoneRef.current ? 1 : 0.15)

      const nextMsg = Math.min(
        GAME_LOADING_MESSAGES.length - 1,
        Math.floor((elapsed / GAME_LOADING_MIN_MS) * GAME_LOADING_MESSAGES.length),
      )
      if (nextMsg !== msgIndex) msgIndex = nextMsg

      const phase: GameLoadingPhase =
        elapsed >= GAME_LOADING_MIN_MS && workDoneRef.current ? 'ready' : 'loading'

      setState({
        phase,
        progress: phase === 'ready' ? 100 : eased,
        message: GAME_LOADING_MESSAGES[msgIndex],
      })
    }, TICK_MS)

    return () => {
      cancelled = true
      if (tick) clearInterval(tick)
    }
  }, [active])

  return {
    ...state,
    isReady: state.phase === 'ready',
  }
}