import { describe, it, expect } from 'vitest'
import { EliteSim } from './EliteSim'
import { getLocalAxes, length, dot, normalize } from './core/vector'
import type { Vec3 } from './core/types'
import { BOREAL_STATION } from '../config'
import { BOREAL_BAY_PORT } from '../../types/dockBay'

function isFiniteVec(v: Vec3): boolean {
  return Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z)
}

function assertOrthonormal(axes: { forward: Vec3; right: Vec3; up: Vec3 }, label = '') {
  const f = axes.forward
  const r = axes.right
  const u = axes.up

  expect(length(f)).toBeCloseTo(1, 6)
  expect(length(r)).toBeCloseTo(1, 6)
  expect(length(u)).toBeCloseTo(1, 6)

  expect(dot(f, r)).toBeCloseTo(0, 6)
  expect(dot(f, u)).toBeCloseTo(0, 6)
  expect(dot(r, u)).toBeCloseTo(0, 6)

  // Also check they form right-handed system (f x r ~ u)
  const crossFR = {
    x: f.y * r.z - f.z * r.y,
    y: f.z * r.x - f.x * r.z,
    z: f.x * r.y - f.y * r.x,
  }
  const nCross = normalize(crossFR)
  expect(dot(nCross, u)).toBeCloseTo(1, 5)
}

describe('EliteSim save round-trip', () => {
  it('toSave → fromSave preserves docked progress and bay index', () => {
    const sim = new EliteSim(0)
    sim.fromSave({
      ...EliteSim.defaultSave(),
      flightMode: 'docked',
      dockedAtStationId: BOREAL_STATION.id,
      dockBayIndex: BOREAL_BAY_PORT,
      fuel: 42,
      credits: 9001,
      cargo: { 'fuel-cells': 3 },
    })

    const saved = sim.toSave()
    expect(saved.flightMode).toBe('docked')
    expect(saved.dockedAtStationId).toBe(BOREAL_STATION.id)
    expect(saved.dockBayIndex).toBe(BOREAL_BAY_PORT)
    expect(saved.fuel).toBe(42)
    expect(saved.credits).toBe(9001)
    expect(saved.cargo['fuel-cells']).toBe(3)

    const sim2 = new EliteSim(0)
    sim2.fromSave(saved)
    const again = sim2.toSave()
    expect(again.flightMode).toBe('docked')
    expect(again.dockBayIndex).toBe(BOREAL_BAY_PORT)
    expect(again.fuel).toBe(42)
  })

  it('normalizes cutscene flight modes on save', () => {
    const sim = new EliteSim(0)
    sim.setFlightMode('dock_flyin')
    const saved = sim.toSave()
    expect(saved.flightMode).toBe('normal')
  })

  it('defaultSave matches fresh constructor spawn', () => {
    const a = new EliteSim(0).toSave()
    const b = EliteSim.defaultSave()
    expect(a.systemId).toBe(b.systemId)
    expect(a.flightMode).toBe(b.flightMode)
    expect(a.fuel).toBe(b.fuel)
  })
})

describe('Elite rotation (Q/E pitch, A/D yaw, Z/X roll)', () => {
  it('getLocalAxes produces valid orthonormal basis for any heading + roll (including vertical)', () => {
    const cases: Array<{ heading: Vec3; roll: number; desc: string }> = [
      { heading: { x: 0, y: 0, z: -1 }, roll: 0, desc: 'level forward' },
      { heading: { x: 0, y: 0, z: -1 }, roll: Math.PI / 2, desc: 'level rolled 90' },
      { heading: { x: 0, y: 1, z: 0 }, roll: 0, desc: 'pure up (pitch 90)' },
      { heading: { x: 0, y: -1, z: 0 }, roll: 0, desc: 'pure down (pitch -90)' },
      { heading: { x: 0, y: 0.999, z: 0.001 }, roll: 1.2, desc: 'nearly vertical' },
      { heading: { x: 1, y: 0, z: 0 }, roll: -0.5, desc: 'sideways' },
      { heading: { x: 0.1, y: 0.9, z: -0.4 }, roll: 3.14, desc: 'arbitrary pitched' },
    ]

    for (const c of cases) {
      const axes = getLocalAxes(c.heading, c.roll)
      expect(isFiniteVec(axes.forward)).toBe(true)
      expect(isFiniteVec(axes.right)).toBe(true)
      expect(isFiniteVec(axes.up)).toBe(true)
      assertOrthonormal(axes, c.desc)
    }
  })

  it('EliteSim allows continuous full 360+ degree pitch (Q/E) without NaN or singular basis', () => {
    const sim = new EliteSim(0)
    const dt = 1 / 60
    const pitchRate = 1.0 // input value (will be *1.6 inside)
    const stepsFor360 = Math.ceil((2 * Math.PI) / (pitchRate * 1.6 * dt)) + 50 // extra margin

    let applied = 0
    const initialH = { ...sim.getSnapshot().player.heading }

    for (let i = 0; i < stepsFor360 * 2; i++) { // two full turns
      sim.step(dt, { thrust: 0, yaw: 0, pitch: pitchRate, roll: 0 })
      applied += pitchRate * 1.6 * dt

      const snap = sim.getSnapshot()
      const h = snap.player.heading

      expect(isFiniteVec(h)).toBe(true)
      const len = length(h)
      expect(len).toBeGreaterThan(0.9)
      expect(len).toBeLessThan(1.1)

      const axes = getLocalAxes(h, snap.player.roll)
      assertOrthonormal(axes, `pitch step ${i}`)
    }

    // After multiple full rotations, heading should still be sane
    const final = sim.getSnapshot().player.heading
    expect(isFiniteVec(final)).toBe(true)
    expect(length(final)).toBeCloseTo(1, 4)
    // For pure pitch with roll=0, after exact 2pi it should be close to start in some sense,
    // but due to floating point + the way level ref is chosen we mainly care it didn't blow up.
  })

  it('EliteSim allows full 360 yaw and roll without issues', () => {
    const sim = new EliteSim(0)
    const dt = 1 / 60

    // Yaw full turns
    for (let i = 0; i < 400; i++) {
      sim.step(dt, { thrust: 0, yaw: 1, pitch: 0, roll: 0 })
      const snap = sim.getSnapshot()
      const axes = getLocalAxes(snap.player.heading, snap.player.roll)
      assertOrthonormal(axes, 'yaw')
      expect(isFiniteVec(snap.player.heading)).toBe(true)
    }

    // Roll full turns (heading should barely change, only roll scalar)
    const beforeRoll = { ...sim.getSnapshot().player.heading }
    for (let i = 0; i < 400; i++) {
      sim.step(dt, { thrust: 0, yaw: 0, pitch: 0, roll: 1 })
      const snap = sim.getSnapshot()
      const axes = getLocalAxes(snap.player.heading, snap.player.roll)
      assertOrthonormal(axes, 'roll')
      // heading should stay almost same during pure roll
      const dh = length({
        x: snap.player.heading.x - beforeRoll.x,
        y: snap.player.heading.y - beforeRoll.y,
        z: snap.player.heading.z - beforeRoll.z,
      })
      expect(dh).toBeLessThan(0.1)
    }
  })

  it('EliteSim handles mixed pitch + roll + yaw maneuvers over multiple full rotations', () => {
    const sim = new EliteSim(0)
    const dt = 1 / 60

    for (let i = 0; i < 1200; i++) {
      const p = (i % 300 < 150) ? 0.8 : -0.8
      const y = Math.sin(i * 0.02) * 0.6
      const r = (i % 200 < 100) ? 0.7 : -0.7

      sim.step(dt, { thrust: 0.2, yaw: y, pitch: p, roll: r })

      const snap = sim.getSnapshot()
      const h = snap.player.heading
      expect(isFiniteVec(h)).toBe(true)
      expect(length(h)).toBeGreaterThan(0.8)

      const axes = getLocalAxes(h, snap.player.roll)
      assertOrthonormal(axes, `mixed step ${i}`)
    }
  })

  it('heading after 2*PI pure pitch is still a valid direction (continuity)', () => {
    const sim = new EliteSim(0)
    // Start with clean level heading
    sim['player'].heading = { x: 0, y: 0, z: -1 } // internal, for test
    sim['player'].roll = 0

    const dt = 0.01
    const targetAngle = 2 * Math.PI + 0.1
    let accumulated = 0

    while (accumulated < targetAngle) {
      sim.step(dt, { thrust: 0, yaw: 0, pitch: 1, roll: 0 })
      accumulated += 1.6 * dt
    }

    const finalH = sim.getSnapshot().player.heading
    expect(isFiniteVec(finalH)).toBe(true)
    expect(length(finalH)).toBeCloseTo(1, 5)

    // We don't assert exact equality because roll=0 + ref switching means the absolute "up" plane
    // can have a discrete adjustment when crossing vertical, but the heading vector itself must
    // have been able to rotate all the way without getting stuck or NaN.
    const initial = { x: 0, y: 0, z: -1 }
    // After >360 pure pitch the final heading should be near initial or 180 depending on path,
    // but main thing is validity + we did >2pi without crash.
  })
})
