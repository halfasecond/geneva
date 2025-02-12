import { renderHook, act } from '@testing-library/react'
import { expect, vi, test, beforeEach, describe } from 'vitest'
import { useMovement } from './useMovement'
import type { Position } from '../../../server/types'
import { waitFor } from '@testing-library/react'

const mockInitialPosition: Position = { x: 100, y: 150, direction: 'right' as const }

describe('useMovement', () => {
    const defaultProps = {
        viewportWidth: 800,
        viewportHeight: 600,
        initialPosition: mockInitialPosition,
        onPositionChange: vi.fn(),
        introActive: true,
        movementDisabled: false,
        onMessageTrigger: vi.fn(),
        forcePosition: undefined,
        racingHorsePosition: undefined
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Race Sequence', () => {
        test('complete race sequence matches Paddock behavior', async () => {
            const { result, rerender } = renderHook(() => useMovement(defaultProps))
            
            // Initial state - can move
            await act(async () => {
                const keyDownEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' })
                window.dispatchEvent(keyDownEvent)
                // Let movement animation frame run
                await new Promise(resolve => setTimeout(resolve, 50))
            })

            await waitFor(() => {
                expect(result.current.position.x).toBeGreaterThan(mockInitialPosition.x)
            })

            // Race countdown - move to finish line, disable movement
            await act(async () => {
                rerender({
                    ...defaultProps,
                    movementDisabled: true,
                    forcePosition: { x: 1990, y: 2060, direction: 'right' as const },
                    racingHorsePosition: { x: 580, y: 1800 }
                })
                // Let state updates settle
                await new Promise(resolve => setTimeout(resolve, 50))
            })

            // Try to move during race - should stay at finish line
            await act(async () => {
                const keyDownEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' })
                window.dispatchEvent(keyDownEvent)
                await new Promise(resolve => setTimeout(resolve, 50))
            })

            await waitFor(() => {
                expect(result.current.position).toEqual({ x: 1990, y: 2060, direction: 'right' })
            })

            // Race finished - clear race state
            await act(async () => {
                rerender({
                    ...defaultProps,
                    movementDisabled: false,
                    forcePosition: undefined,
                    racingHorsePosition: undefined,
                    introActive: false // Path restrictions should be off after race
                })
                await new Promise(resolve => setTimeout(resolve, 50))
            })

            // Should be able to move again
            const startX = result.current.position.x
            await act(async () => {
                const keyDownEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' })
                window.dispatchEvent(keyDownEvent)
                await new Promise(resolve => setTimeout(resolve, 50))
            })

            await waitFor(() => {
                expect(result.current.position.x).toBeGreaterThan(startX)
            })
        })

        test('viewport follows race position during race', async () => {
            const { result, rerender } = renderHook(() => useMovement(defaultProps))

            const racePosition = { x: 580, y: 1800 }
            
            // Start race
            await act(async () => {
                rerender({
                    ...defaultProps,
                    movementDisabled: true,
                    forcePosition: { x: 1990, y: 2060, direction: 'right' as const },
                    racingHorsePosition: racePosition
                })
                await new Promise(resolve => setTimeout(resolve, 50))
            })

            // Viewport should follow race position
            await waitFor(() => {
                expect(result.current.viewportOffset.x).toBe(racePosition.x - (800 * 0.2))
                expect(result.current.viewportOffset.y).toBe(racePosition.y - (600 * 0.7))
            })
        })

        test('path restrictions are removed after race', async () => {
            const { result, rerender } = renderHook(() => useMovement(defaultProps))

            // During race
            await act(async () => {
                rerender({
                    ...defaultProps,
                    movementDisabled: true,
                    forcePosition: { x: 1990, y: 2060, direction: 'right' as const },
                    racingHorsePosition: { x: 580, y: 1800 }
                })
                await new Promise(resolve => setTimeout(resolve, 50))
            })

            // After race
            await act(async () => {
                rerender({
                    ...defaultProps,
                    movementDisabled: false,
                    forcePosition: undefined,
                    racingHorsePosition: undefined,
                    introActive: false
                })
                await new Promise(resolve => setTimeout(resolve, 50))
            })

            // Should be able to move off bridleway
            await act(async () => {
                const keyDownEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' })
                window.dispatchEvent(keyDownEvent)
                await new Promise(resolve => setTimeout(resolve, 50))
            })

            await waitFor(() => {
                expect(result.current.position.x).toBeGreaterThan(1990)
            })
        })
    })
})