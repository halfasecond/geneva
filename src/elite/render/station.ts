/**
 * Procedural space station meshes — torus habitat ring, command spire, docking arms.
 * Wireframe holo aesthetic to match cockpit + NPC ships.
 */

import * as THREE from 'three'
import { STATION } from '../config'

export interface StationAnimTargets {
  ring: THREE.Object3D
  beacons: THREE.Mesh[]
}

/** Build a ring-and-spire station scaled from cartography body radius. */
export function createStationMesh(color: string, radius: number): THREE.Group {
  const group = new THREE.Group()
  const accent = new THREE.Color(color)
  const s = radius * STATION.scaleFromRadius

  const hullMat = new THREE.MeshBasicMaterial({
    color: accent,
    wireframe: true,
    transparent: true,
    opacity: STATION.hullOpacity,
    fog: false,
  })
  const panelMat = new THREE.MeshBasicMaterial({
    color: STATION.panelColor,
    transparent: true,
    opacity: STATION.panelOpacity,
    side: THREE.DoubleSide,
    fog: false,
  })
  const spineMat = new THREE.LineBasicMaterial({
    color: accent,
    transparent: true,
    opacity: 0.55,
    fog: false,
  })

  // Central command spire
  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(s * 0.22, s * 0.34, s * 1.1, 10, 1, true),
    hullMat,
  )
  hub.position.y = s * 0.05
  group.add(hub)

  const antenna = new THREE.Mesh(
    new THREE.ConeGeometry(s * 0.08, s * 0.55, 6),
    hullMat,
  )
  antenna.position.y = s * 0.82
  group.add(antenna)

  // Rotating habitation ring
  const ringGroup = new THREE.Group()
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(s * STATION.ringMajor, s * STATION.ringMinor, 10, 28),
    hullMat,
  )
  ring.rotation.x = Math.PI / 2
  ringGroup.add(ring)

  const windowBand = new THREE.Mesh(
    new THREE.TorusGeometry(s * STATION.ringMajor, s * STATION.ringMinor * 0.55, 8, 28),
    panelMat,
  )
  windowBand.rotation.x = Math.PI / 2
  ringGroup.add(windowBand)

  group.add(ringGroup)

  // Docking arms + solar wings
  const armDirs: Array<[number, number, number]> = [
    [1, 0, 0],
    [-0.5, 0, 0.86],
    [-0.5, 0, -0.86],
  ]
  armDirs.forEach(([dx, , dz], i) => {
    const arm = new THREE.Group()
    const len = s * STATION.armLength
    const beam = new THREE.Mesh(
      new THREE.BoxGeometry(len, s * 0.07, s * 0.12),
      hullMat,
    )
    beam.position.set(dx * len * 0.5, 0, dz * len * 0.5)
    beam.rotation.y = Math.atan2(dx, dz)
    arm.add(beam)

    const dock = new THREE.Mesh(
      new THREE.BoxGeometry(s * 0.18, s * 0.18, s * 0.18),
      hullMat,
    )
    dock.position.set(dx * len, 0, dz * len)
    arm.add(dock)

    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(s * STATION.solarW, s * STATION.solarH),
      panelMat,
    )
    panel.position.set(dx * (len * 0.55), s * 0.22, dz * (len * 0.55))
    panel.rotation.y = Math.atan2(dx, dz)
    panel.rotation.x = -Math.PI / 2 + (i % 2 === 0 ? 0.25 : -0.18)
    arm.add(panel)

    group.add(arm)
  })

  // Spine truss lines between hub and ring
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2
    const rx = Math.cos(a) * s * STATION.ringMajor
    const rz = Math.sin(a) * s * STATION.ringMajor
    const pts = [
      new THREE.Vector3(0, s * 0.15, 0),
      new THREE.Vector3(rx * 0.35, 0, rz * 0.35),
      new THREE.Vector3(rx, 0, rz),
    ]
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), spineMat))
  }

  const beacons: THREE.Mesh[] = []
  const beaconGeo = new THREE.SphereGeometry(s * 0.06, 8, 8)
  const beaconColors = [STATION.beaconA, STATION.beaconB]
  beaconColors.forEach((hex, i) => {
    const beacon = new THREE.Mesh(
      beaconGeo,
      new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: 0.9, fog: false }),
    )
    const ang = i * Math.PI + 0.4
    beacon.position.set(
      Math.cos(ang) * s * (STATION.ringMajor + STATION.ringMinor * 1.4),
      s * 0.12,
      Math.sin(ang) * s * (STATION.ringMajor + STATION.ringMinor * 1.4),
    )
    group.add(beacon)
    beacons.push(beacon)
  })

  group.userData.stationAnim = { ring: ringGroup, beacons } satisfies StationAnimTargets
  return group
}

export function createPlanetMesh(color: string, radius: number): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.SphereGeometry(radius * 0.9, 18, 18),
    new THREE.MeshBasicMaterial({ color, fog: false }),
  )
}

/** Slow ring spin + pulsing nav beacons. */
export function updateStationAnimations(root: THREE.Object3D, time: number) {
  root.traverse(obj => {
    const anim = obj.userData.stationAnim as StationAnimTargets | undefined
    if (!anim) return

    anim.ring.rotation.y = time * STATION.ringSpin
    anim.beacons.forEach((beacon, i) => {
      const mat = beacon.material as THREE.MeshBasicMaterial
      const pulse = 0.45 + 0.55 * Math.abs(Math.sin(time * STATION.beaconPulse + i * 1.7))
      mat.opacity = pulse
      beacon.scale.setScalar(0.85 + pulse * 0.35)
    })
  })
}