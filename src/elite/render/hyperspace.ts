/**
 * Camera-attached hyperspace tunnel streaks — aligned with the cockpit reticle / forward view.
 */
import * as THREE from 'three'
import { HYPERSPACE } from '../config'

export interface HyperspaceStreakGroup {
  group: THREE.Group
  streaks: THREE.Line[]
}

export function createHyperspaceStreaks(camera: THREE.Camera): HyperspaceStreakGroup {
  const group = new THREE.Group()
  camera.add(group)

  const streakMat = new THREE.LineBasicMaterial({
    color: HYPERSPACE.streakColor,
    transparent: true,
    opacity: 0.8,
  })

  const streaks: THREE.Line[] = []
  for (let i = 0; i < HYPERSPACE.streakCount; i++) {
    const len = HYPERSPACE.streakLenMin + Math.random() * HYPERSPACE.streakLenVar
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -len),
    ])
    const line = new THREE.Line(geo, streakMat.clone())
    const r = HYPERSPACE.streakRadiusMin + Math.random() * HYPERSPACE.streakRadiusVar
    const a = Math.random() * Math.PI * 2
    const z = HYPERSPACE.spawnZMin - Math.random() * HYPERSPACE.spawnZVar
    line.position.set(Math.cos(a) * r, Math.sin(a) * r * HYPERSPACE.streakYScale, z)
    line.userData = { radius: r, angle: a }
    group.add(line)
    streaks.push(line)
  }

  group.visible = false
  return { group, streaks }
}

/** Rush streaks toward the camera along the forward axis (camera-local space). */
export function updateHyperspaceStreaks(streaks: THREE.Line[], phase: number, dt: number) {
  const speed = HYPERSPACE.speedBase * (1 + phase * HYPERSPACE.movePhaseFactor)

  streaks.forEach(line => {
    line.position.z += speed * dt

    if (line.position.z > HYPERSPACE.passZ) {
      const r = HYPERSPACE.streakRadiusMin + Math.random() * HYPERSPACE.streakRadiusVar
      const a = Math.random() * Math.PI * 2
      line.position.set(
        Math.cos(a) * r,
        Math.sin(a) * r * HYPERSPACE.streakYScale,
        HYPERSPACE.spawnZMin - Math.random() * HYPERSPACE.spawnZVar,
      )
      ;(line.userData as { radius: number; angle: number }).radius = r
      ;(line.userData as { radius: number; angle: number }).angle = a
    }

    const mat = line.material as THREE.LineBasicMaterial
    mat.opacity = Math.max(0.15, 0.85 - phase * 0.55)
  })
}