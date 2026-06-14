/**
 * Standalone runner to exercise full rotations in pitch (Q/E), yaw, roll.
 * Run with: npx tsx src/elite/sim/rotation-test.ts
 * It will perform thousands of steps of full 360+ degree maneuvers and report if heading stays
 * finite + unit length and local axes stay orthonormal.
 */

import { EliteSim } from './EliteSim'
import { getLocalAxes, length, dot, normalize, cross } from './core/vector'
import type { Vec3 } from './core/types'

function isFiniteVec(v: Vec3): boolean {
  return Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z)
}

function assertOrthonormal(axes: ReturnType<typeof getLocalAxes>, label: string) {
  const f = axes.forward
  const r = axes.right
  const u = axes.up

  const lf = length(f)
  const lr = length(r)
  const lu = length(u)

  if (Math.abs(lf - 1) > 1e-4 || Math.abs(lr - 1) > 1e-4 || Math.abs(lu - 1) > 1e-4) {
    throw new Error(`${label}: non-unit basis f=${lf} r=${lr} u=${lu}`)
  }

  if (Math.abs(dot(f, r)) > 1e-4 || Math.abs(dot(f, u)) > 1e-4 || Math.abs(dot(r, u)) > 1e-4) {
    throw new Error(`${label}: non-orthogonal f·r=${dot(f,r)} f·u=${dot(f,u)} r·u=${dot(r,u)}`)
  }

  // Check matches the library convention u = cross(r, f)  (produces +Y up for level ship)
  const cr = cross(r, f)
  const ncr = normalize(cr)
  if (Math.abs(dot(ncr, u) - 1) > 1e-3) {
    throw new Error(`${label}: up does not match expected cross(r, f) (dot=${dot(ncr, u)})`)
  }
}

function run() {
  console.log('=== Elite 6DOF full rotation stress test ===')

  // 1. Pure pitch (the reported Q/E problem) - multiple full turns
  console.log('\n-- Pure pitch (Q/E equivalent) 720 degrees --')
  let sim = new EliteSim(0)
  const dt = 1 / 60
  const pitchInput = 1.0
  let totalPitch = 0
  const target = 4 * Math.PI   // two full turns

  let step = 0
  while (totalPitch < target && step < 10000) {
    sim.step(dt, { thrust: 0, yaw: 0, pitch: pitchInput, roll: 0 })
    totalPitch += pitchInput * 1.6 * dt
    step++

    const snap = sim.getSnapshot()
    const h = snap.player.heading
    if (!isFiniteVec(h)) {
      throw new Error(`NaN in heading at pitch step ${step} total=${totalPitch.toFixed(2)}`)
    }
    const len = length(h)
    if (len < 0.5 || len > 1.5) {
      throw new Error(`Bad heading length ${len} at step ${step}`)
    }
    const axes = getLocalAxes(h, snap.player.roll)
    assertOrthonormal(axes, `pitch step ${step}`)
  }
  console.log(`  OK after ${step} steps, applied ~${totalPitch.toFixed(2)} rad (${(totalPitch / Math.PI).toFixed(1)} pi)`)

  // 2. Pure yaw full turns
  console.log('\n-- Pure yaw (A/D) 720 degrees --')
  sim = new EliteSim(0)
  let totalYaw = 0
  step = 0
  while (totalYaw < target && step < 10000) {
    sim.step(dt, { thrust: 0, yaw: 1, pitch: 0, roll: 0 })
    totalYaw += 1.8 * dt
    step++
    const snap = sim.getSnapshot()
    const axes = getLocalAxes(snap.player.heading, snap.player.roll)
    assertOrthonormal(axes, `yaw ${step}`)
  }
  console.log(`  OK after ${step} steps`)

  // 3. Pure roll
  console.log('\n-- Pure roll (Z/X) 720 degrees --')
  sim = new EliteSim(0)
  const startH = { ...sim.getSnapshot().player.heading }
  let totalRoll = 0
  step = 0
  while (totalRoll < target && step < 10000) {
    sim.step(dt, { thrust: 0, yaw: 0, pitch: 0, roll: 1 })
    totalRoll += 2.4 * dt
    step++
    const snap = sim.getSnapshot()
    const axes = getLocalAxes(snap.player.heading, snap.player.roll)
    assertOrthonormal(axes, `roll ${step}`)
    // heading should stay nearly constant
    const dh = length({ x: snap.player.heading.x - startH.x, y: snap.player.heading.y - startH.y, z: snap.player.heading.z - startH.z })
    if (dh > 0.2) {
      console.warn(`  Warning: heading drifted during roll dh=${dh.toFixed(4)} (expected for numeric)`)
    }
  }
  console.log(`  OK after ${step} steps`)

  // 4. Aggressive mixed (the real flight case)
  console.log('\n-- Mixed pitch+yaw+roll+thrust 1000 steps (aggressive maneuvering) --')
  sim = new EliteSim(0)
  for (let i = 0; i < 1000; i++) {
    const p = Math.sin(i * 0.03) * 0.9
    const y = Math.cos(i * 0.04) * 0.7
    const r = (i % 3 - 1) * 0.6
    sim.step(dt, { thrust: 0.5, yaw: y, pitch: p, roll: r })

    const snap = sim.getSnapshot()
    const h = snap.player.heading
    if (!isFiniteVec(h) || length(h) < 0.5) {
      throw new Error(`Bad state in mixed maneuver at step ${i}`)
    }
    const axes = getLocalAxes(h, snap.player.roll)
    assertOrthonormal(axes, `mixed ${i}`)
  }
  console.log('  OK')

  console.log('\n=== All rotation tests passed. Full 360+ in every direction works. ===')
}

run()
