/**
 * Camera-attached hyperspace tunnel — box streaks (WebGL lines are 1px and vanish in fog).
 */
import * as THREE from 'three'
import { HYPERSPACE } from '../config'

export interface HyperspaceStreakGroup {
  group: THREE.Group
  streaks: THREE.Mesh[]
}

export function createHyperspaceStreaks(camera: THREE.Camera): HyperspaceStreakGroup {
  const group = new THREE.Group()
  group.renderOrder = 200
  group.frustumCulled = false
  camera.add(group)

  const streaks: THREE.Mesh[] = []
  for (let i = 0; i < HYPERSPACE.streakCount; i++) {
    const len = HYPERSPACE.streakLenMin + Math.random() * HYPERSPACE.streakLenVar
    const geo = new THREE.BoxGeometry(HYPERSPACE.streakWidth, HYPERSPACE.streakWidth, len)
    const mat = new THREE.MeshBasicMaterial({
      color: HYPERSPACE.streakColor,
      transparent: true,
      opacity: 0.85,
      fog: false,
      depthWrite: false,
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.frustumCulled = false
    mesh.renderOrder = 200

    const r = HYPERSPACE.streakRadiusMin + Math.random() * HYPERSPACE.streakRadiusVar
    const a = Math.random() * Math.PI * 2
    const z = HYPERSPACE.spawnZMin - Math.random() * HYPERSPACE.spawnZVar
    mesh.position.set(
      Math.cos(a) * r,
      Math.sin(a) * r * HYPERSPACE.streakYScale,
      z - len * 0.5,
    )
    mesh.userData.baseLen = len
    streaks.push(mesh)
    group.add(mesh)
  }

  group.visible = false
  return { group, streaks }
}

/** Rush streaks toward the camera along the forward axis (camera-local space). */
export function updateHyperspaceStreaks(streaks: THREE.Mesh[], phase: number, dt: number) {
  const speed = HYPERSPACE.speedBase * (1 + phase * HYPERSPACE.movePhaseFactor)

  streaks.forEach(mesh => {
    mesh.position.z += speed * dt
    const len = mesh.userData.baseLen as number

    if (mesh.position.z + len * 0.5 > HYPERSPACE.passZ) {
      const r = HYPERSPACE.streakRadiusMin + Math.random() * HYPERSPACE.streakRadiusVar
      const a = Math.random() * Math.PI * 2
      const newLen = HYPERSPACE.streakLenMin + Math.random() * HYPERSPACE.streakLenVar
      const z = HYPERSPACE.spawnZMin - Math.random() * HYPERSPACE.spawnZVar
      mesh.position.set(
        Math.cos(a) * r,
        Math.sin(a) * r * HYPERSPACE.streakYScale,
        z - newLen * 0.5,
      )
      mesh.scale.set(1, 1, newLen / len)
      mesh.userData.baseLen = newLen
    }

    const mat = mesh.material as THREE.MeshBasicMaterial
    mat.opacity = Math.max(0.2, 0.9 - phase * 0.5)
  })
}