import { describe, it, expect } from 'vitest'
import {
  bodyLocalPos,
  bodyOffsetFromPlayer,
  offsetFromPlayer,
  systemPos2dFromLocal,
  viewBasisFromAttitude,
  worldOffsetToBodyFrame,
} from './systemSpace'
import { getBodyById } from './cartography'
import { nearestDockableStation } from './market'

const PLANET = {
  id: 'boreal',
  type: 'planet' as const,
  pos2d: { x: 0, y: 100 },
}

describe('systemSpace frame', () => {
  it('bodyOffsetFromPlayer shifts 1:1 with player translation, not 2:1', () => {
    const navRef = { x: 0, y: 0 }
    const pos0 = { x: 0, y: 0, z: 0 }
    const pos1 = { x: 0, y: 0, z: 100 }

    const sys0 = systemPos2dFromLocal(navRef, pos0)
    const sys1 = systemPos2dFromLocal(navRef, pos1)

    const off0 = bodyOffsetFromPlayer(PLANET, sys0)
    const off1 = bodyOffsetFromPlayer(PLANET, sys1)

    expect(off1.z - off0.z).toBeCloseTo(-100, 5)
  })

  it('viewBasisFromAttitude stays orthonormal after many rotations', () => {
    let heading = { x: 0, y: 0, z: -1 }
    let up = { x: 0, y: 1, z: 0 }
    const rot = (v: { x: number; y: number; z: number }, axis: { x: number; y: number; z: number }, a: number) => {
      const c = Math.cos(a)
      const s = Math.sin(a)
      const dot = v.x * axis.x + v.y * axis.y + v.z * axis.z
      const cross = {
        x: axis.y * v.z - axis.z * v.y,
        y: axis.z * v.x - axis.x * v.z,
        z: axis.x * v.y - axis.y * v.x,
      }
      return {
        x: v.x * c + cross.x * s + axis.x * dot * (1 - c),
        y: v.y * c + cross.y * s + axis.y * dot * (1 - c),
        z: v.z * c + cross.z * s + axis.z * dot * (1 - c),
      }
    }
    for (let i = 0; i < 40; i++) {
      heading = rot(heading, up, 0.15)
      up = rot(up, heading, 0.11)
      const axes = viewBasisFromAttitude(heading, up)
      const fDotU = axes.forward.x * axes.up.x + axes.forward.y * axes.up.y + axes.forward.z * axes.up.z
      const fDotR = axes.forward.x * axes.right.x + axes.forward.y * axes.right.y + axes.forward.z * axes.right.z
      const uDotR = axes.up.x * axes.right.x + axes.up.y * axes.right.y + axes.up.z * axes.right.z
      expect(Math.abs(fDotU)).toBeLessThan(0.02)
      expect(Math.abs(fDotR)).toBeLessThan(0.02)
      expect(Math.abs(uDotR)).toBeLessThan(0.02)
    }
  })

  it('worldOffsetToBodyFrame lateral stable when thrusting straight ahead', () => {
    const navRef = { x: 0, y: 0 }
    const heading = { x: 0, y: 0, z: -1 }
    const up = { x: 0, y: 1, z: 0 }
    const planet = { id: 'boreal', type: 'planet' as const, pos2d: { x: 40, y: 80 } }

    const off0 = bodyLocalPos(planet, systemPos2dFromLocal(navRef, { x: 0, y: 0, z: 0 }))
    const off1 = bodyLocalPos(planet, systemPos2dFromLocal(navRef, { x: 0, y: 0, z: 250 }))

    const frame0 = worldOffsetToBodyFrame(off0, heading, up, { fromCockpitEye: true })
    const frame1 = worldOffsetToBodyFrame(off1, heading, up, { fromCockpitEye: true })

    expect(frame0.x).toBeCloseTo(frame1.x, 1)
  })

  it('worldOffsetToBodyFrame forward component changes 1:1 with translation, not 2:1', () => {
    const navRef = { x: 0, y: 0 }
    const heading = { x: 0, y: 0, z: -1 }
    const up = { x: 0, y: 1, z: 0 }

    const off0 = bodyLocalPos(PLANET, systemPos2dFromLocal(navRef, { x: 0, y: 0, z: 0 }))
    const off1 = bodyLocalPos(PLANET, systemPos2dFromLocal(navRef, { x: 0, y: 0, z: 100 }))

    const frame0 = worldOffsetToBodyFrame(off0, heading, up)
    const frame1 = worldOffsetToBodyFrame(off1, heading, up)

    // Heading -Z: forward depth tracks -offset.z; moving +100 toward planet closes range by 100.
    expect(frame1.z - frame0.z).toBeCloseTo(100, 3)
    expect(frame1.dist - frame0.dist).toBeCloseTo(-100, 3)
  })

  it('worldOffsetToBodyFrame bearing changes under rotation-only', () => {
    const offset = bodyLocalPos(PLANET, { x: 0, y: 0 })
    const up = { x: 0, y: 1, z: 0 }

    const level = worldOffsetToBodyFrame(offset, { x: 0, y: 0, z: -1 }, up)
    const yawed = worldOffsetToBodyFrame(offset, { x: 1, y: 0, z: 0 }, up)

    expect(level.z).not.toBeCloseTo(yawed.z, 1)
    expect(level.dist).toBeCloseTo(yawed.dist, 3)
  })

  it('offsetFromPlayer matches explicit subtract for NPC-style coords', () => {
    const player = { x: 10, y: 5, z: -20 }
    const npc = { x: 30, y: 5, z: 0 }
    const off = offsetFromPlayer(player, npc)
    expect(off).toEqual({ x: 20, y: 0, z: 20 })
  })

  it('nearestDockableStation does not double-count player position', () => {
    const station = getBodyById('aster-hub', 'frozen')
    expect(station).toBeTruthy()
    if (!station) return

    const playerPos = { x: 0, y: 0, z: 0 }
    const systemPos2d = { ...station.pos2d }

    const offset = bodyLocalPos(station, systemPos2d)
    const expectedDist = Math.hypot(offset.x, offset.y, offset.z)

    const nearest = nearestDockableStation(playerPos, systemPos2d, 0, expectedDist + 1, 100)
    expect(nearest?.id).toBe('aster-hub')
    expect(nearest?.dist).toBeCloseTo(expectedDist, 3)
  })
})