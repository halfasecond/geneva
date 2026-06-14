/**
 * render/cockpit.ts
 * Pure(ish) Three.js helpers for building the "you are inside the ship" cockpit frame
 * and the 3D holographic elements that live attached to the camera.
 *
 * These replace the giant inline blocks that used to live in Elite.tsx useEffect.
 * Call them once during scene setup; they add children directly to the camera.
 */

import * as THREE from 'three'
import { COLORS, COCKPIT, RADAR_3D, RETICLE, FUEL, VECH } from '../config'

// -----------------------------------------------------------------------------
// Main cockpit shell (the visible ship frame + canopy + interior walls)
// -----------------------------------------------------------------------------
export function createCockpitFrame(camera: THREE.PerspectiveCamera) {
  // The "external" player ship group (cone + wings + glow) is created but kept
  // invisible; we clone a scaled/positioned version into the camera for the
  // first-person view. This matches the original "vech first pass" approach.
  const playerGroup = new THREE.Group()

  const body = new THREE.Mesh(
    new THREE.ConeGeometry(COCKPIT.external.body.radius, COCKPIT.external.body.height, 3),
    new THREE.MeshBasicMaterial({ color: 0xccd5dd, wireframe: true })
  )
  body.rotation.x = COCKPIT.external.body.rotX
  playerGroup.add(body)

  const wingMat = new THREE.MeshBasicMaterial({ color: 0x88aacc })
  const wingL = new THREE.Mesh(
    new THREE.BoxGeometry(COCKPIT.external.wing.w, COCKPIT.external.wing.h, COCKPIT.external.wing.d),
    wingMat
  )
  wingL.position.set(-COCKPIT.external.wing.x, 0, 1)
  playerGroup.add(wingL)

  const wingR = wingL.clone()
  wingR.position.x = COCKPIT.external.wing.x
  playerGroup.add(wingR)

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(COCKPIT.external.glow.r, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0x66eeff, transparent: true, opacity: COCKPIT.external.glow.opacity })
  )
  glow.position.z = COCKPIT.external.glow.z
  playerGroup.add(glow)

  // The actual visible cockpit (child of camera)
  const cockpit = playerGroup.clone()
  cockpit.visible = true
  cockpit.scale.setScalar(COCKPIT.scale)
  cockpit.position.set(COCKPIT.position.x, COCKPIT.position.y, COCKPIT.position.z)
  cockpit.rotation.x = COCKPIT.rotationX
  camera.add(cockpit)

  // Extra canopy ring
  const canopyPts = Array.from({ length: 36 }, (_, i) => {
    const a = (i / 36) * Math.PI * 2
    return new THREE.Vector3(
      Math.cos(a) * COCKPIT.canopyRadiusX,
      Math.sin(a) * COCKPIT.canopyRadiusY - COCKPIT.canopyYOffset,
      COCKPIT.canopyZ
    )
  })
  const canopy = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(canopyPts),
    new THREE.LineBasicMaterial({ color: 0x88aacc, transparent: true, opacity: 0.12 })
  )
  cockpit.add(canopy)

  // Lite interior structure (dashboard, struts, side walls)
  const cockpitInterior = new THREE.Group()
  camera.add(cockpitInterior)

  // Lower console
  const consoleBase = new THREE.Mesh(
    new THREE.BoxGeometry(COCKPIT.consoleBase.size.x, COCKPIT.consoleBase.size.y, COCKPIT.consoleBase.size.z),
    new THREE.MeshBasicMaterial({ color: 0x111111, wireframe: true })
  )
  consoleBase.position.set(
    COCKPIT.consoleBase.pos.x,
    COCKPIT.consoleBase.pos.y,
    COCKPIT.consoleBase.pos.z
  )
  cockpitInterior.add(consoleBase)

  // Left / right consoles
  const leftConsole = new THREE.Mesh(
    new THREE.BoxGeometry(COCKPIT.sideConsole.width, COCKPIT.sideConsole.height, COCKPIT.sideConsole.depth),
    new THREE.MeshBasicMaterial({ color: 0x1a1a1a, wireframe: true })
  )
  leftConsole.position.set(-COCKPIT.sideConsole.x, COCKPIT.sideConsole.y, COCKPIT.sideConsole.z)
  cockpitInterior.add(leftConsole)

  const rightConsole = leftConsole.clone()
  rightConsole.position.x = COCKPIT.sideConsole.x
  cockpitInterior.add(rightConsole)

  // Top strut
  const topStrut = new THREE.Mesh(
    new THREE.BoxGeometry(COCKPIT.topStrut.width, COCKPIT.topStrut.height, COCKPIT.topStrut.depth),
    new THREE.MeshBasicMaterial({ color: 0x222222, wireframe: true })
  )
  topStrut.position.set(0, COCKPIT.topStrut.y, COCKPIT.topStrut.z)
  cockpitInterior.add(topStrut)

  // Vertical window struts
  const leftStrut = new THREE.Mesh(
    new THREE.BoxGeometry(COCKPIT.verticalStrut.width, COCKPIT.verticalStrut.height, COCKPIT.verticalStrut.depth),
    new THREE.MeshBasicMaterial({ color: 0x333333, wireframe: true })
  )
  leftStrut.position.set(-COCKPIT.verticalStrut.x, 0, COCKPIT.verticalStrut.z)
  cockpitInterior.add(leftStrut)

  const rightStrut = leftStrut.clone()
  rightStrut.position.x = COCKPIT.verticalStrut.x
  cockpitInterior.add(rightStrut)

  // Darkening walls (make edges feel like a canopy)
  const wallMat = new THREE.MeshBasicMaterial({
    color: 0x0a0a1a,
    transparent: true,
    opacity: COCKPIT.wall.opacity,
    side: THREE.DoubleSide,
  })

  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(COCKPIT.wall.width, COCKPIT.wall.height), wallMat)
  leftWall.position.set(-COCKPIT.wall.x, 0, COCKPIT.wall.z)
  leftWall.rotation.y = Math.PI / 2
  cockpitInterior.add(leftWall)

  const rightWall = leftWall.clone()
  rightWall.position.x = COCKPIT.wall.x
  cockpitInterior.add(rightWall)

  const topWall = new THREE.Mesh(new THREE.PlaneGeometry(COCKPIT.topWall.width, COCKPIT.topWall.height), wallMat)
  topWall.position.set(0, COCKPIT.topWall.y, COCKPIT.topWall.z)
  topWall.rotation.x = Math.PI / 2
  cockpitInterior.add(topWall)

  return { cockpit, cockpitInterior }
}

// -----------------------------------------------------------------------------
// Central reticle + 3D holographic radar (rings + spokes + blip pool)
// -----------------------------------------------------------------------------
export function createHoloRadarAndReticle(camera: THREE.PerspectiveCamera) {
  // Reticle (always in middle of view)
  const reticleGroup = new THREE.Group()
  camera.add(reticleGroup)
  reticleGroup.position.set(RETICLE.position.x, RETICLE.position.y, RETICLE.position.z)

  const reticleMat = new THREE.LineBasicMaterial({
    color: COLORS.holoPrimary,
    transparent: true,
    opacity: 0.75,
  })

  reticleGroup.add(
    new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-RETICLE.h, 0, 0),
        new THREE.Vector3(RETICLE.h, 0, 0),
      ]),
      reticleMat
    )
  )
  reticleGroup.add(
    new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, -RETICLE.v, 0),
        new THREE.Vector3(0, RETICLE.v, 0),
      ]),
      reticleMat
    )
  )

  const circlePts = Array.from({ length: RETICLE.segments }, (_, i) => {
    const a = (i / RETICLE.segments) * Math.PI * 2
    return new THREE.Vector3(Math.cos(a) * RETICLE.circleR, Math.sin(a) * RETICLE.circleR, 0)
  })
  reticleGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(circlePts), reticleMat))

  // Radar group
  const radarGroup = new THREE.Group()
  camera.add(radarGroup)
  radarGroup.position.set(RADAR_3D.position.x, RADAR_3D.position.y, RADAR_3D.position.z)

  const radarMat = new THREE.LineBasicMaterial({
    color: COLORS.holoPrimary,
    transparent: true,
    opacity: 0.65,
  })

  // Outer ring (elliptical for perspective)
  const outerPts = Array.from({ length: RADAR_3D.outer.segments }, (_, i) => {
    const a = (i / RADAR_3D.outer.segments) * Math.PI * 2
    return new THREE.Vector3(
      Math.cos(a) * RADAR_3D.outer.rx,
      Math.sin(a) * RADAR_3D.outer.ry,
      0
    )
  })
  radarGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(outerPts), radarMat))

  // Inner rings
  for (const r of RADAR_3D.innerRadii) {
    const pts = Array.from({ length: 32 }, (_, i) => {
      const a = (i / 32) * Math.PI * 2
      return new THREE.Vector3(
        Math.cos(a) * RADAR_3D.outer.rx * r,
        Math.sin(a) * RADAR_3D.outer.ry * r,
        0
      )
    })
    radarGroup.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: COLORS.holoPrimary, transparent: true, opacity: 0.35 })
      )
    )
  }

  // Spokes
  for (let i = 0; i < RADAR_3D.spokes; i++) {
    const a = (i / RADAR_3D.spokes) * Math.PI * 2
    radarGroup.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(Math.cos(a) * RADAR_3D.outer.rx, Math.sin(a) * RADAR_3D.outer.ry, 0),
        ]),
        new THREE.LineBasicMaterial({ color: COLORS.holoPrimary, transparent: true, opacity: 0.3 })
      )
    )
  }

  // Pre-create blip pool (re-used every frame - no per-frame alloc)
  const blips: THREE.Object3D[] = []
  const blipGeo = new THREE.SphereGeometry(RADAR_3D.blip.r, RADAR_3D.blip.segments, RADAR_3D.blip.segments)
  for (let i = 0; i < RADAR_3D.blip.count; i++) {
    const blip = new THREE.Mesh(
      blipGeo,
      new THREE.MeshBasicMaterial({ color: 0xffff66 })
    )
    blip.visible = false
    radarGroup.add(blip)
    blips.push(blip)
  }

  return { reticleGroup, radarGroup, blips }
}

// -----------------------------------------------------------------------------
// Fuel bars (right side vertical stack)
// -----------------------------------------------------------------------------
export function createFuelBars(camera: THREE.PerspectiveCamera) {
  const fuelGroup = new THREE.Group()
  camera.add(fuelGroup)
  fuelGroup.position.set(FUEL.groupPos.x, FUEL.groupPos.y, FUEL.groupPos.z)

  const fuelBars: THREE.Object3D[] = []
  for (let i = 0; i < FUEL.barCount; i++) {
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(FUEL.bar.w, FUEL.bar.h, FUEL.bar.d),
      new THREE.MeshBasicMaterial({ color: COLORS.holoPrimary, transparent: true, opacity: 0.55 })
    )
    bar.position.y = i * FUEL.bar.spacing
    fuelGroup.add(bar)
    fuelBars.push(bar)
  }
  return { fuelGroup, fuelBars }
}

// -----------------------------------------------------------------------------
// VECH ship holo ring + light (the 3D icon that lives in the lower-right of the 3D view)
// Note: the actual GLB loading + material override still happens in the caller
// (or will move to a vechLoader helper) because it is async.
// -----------------------------------------------------------------------------
export function createVechHoloIcon(camera: THREE.PerspectiveCamera) {
  const shipIcon = new THREE.Group()
  camera.add(shipIcon)
  shipIcon.position.set(VECH.groupPos.x, VECH.groupPos.y, VECH.groupPos.z)

  const iconRing = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(
      Array.from({ length: VECH.ring.segments }, (_, i) => {
        const a = (i / VECH.ring.segments) * Math.PI * 2
        return new THREE.Vector3(
          Math.cos(a) * VECH.ring.r,
          Math.sin(a) * VECH.ring.ry,
          0
        )
      })
    ),
    new THREE.LineBasicMaterial({ color: VECH.vechRing, transparent: true, opacity: 0.85 })
  )
  shipIcon.add(iconRing)

  const shipLight = new THREE.PointLight(VECH.light.color, VECH.light.intensity, VECH.light.distance)
  shipLight.position.set(VECH.light.pos.x, VECH.light.pos.y, VECH.light.pos.z)
  shipIcon.add(shipLight)

  return { shipIcon, iconRing }
}

// -----------------------------------------------------------------------------
// Helper to update the 3D radar blips from a list of Contacts (from the new shared util)
// -----------------------------------------------------------------------------
export function update3DRadar(
  blips: THREE.Object3D[],
  contacts: Array<{ x: number; y: number; z: number; dist: number; type: string; role?: string }>
) {
  let bidx = 0
  const maxR = 200 // legacy visual scale from original

  contacts.forEach((c) => {
    if (bidx >= blips.length) return
    const blip = blips[bidx++]
    const size = Math.max(RADAR_3D.sizeFar, RADAR_3D.sizeNear * (1 - Math.min(1, c.dist / RADAR_3D.sizeDistDiv)))

    const radarX = c.x * RADAR_3D.projX
    const radarY = c.z * RADAR_3D.projZ + c.y * RADAR_3D.projY

    blip.position.set(radarX, radarY, 0)
    blip.visible = true
    blip.scale.setScalar(size)

    const mat = (blip as THREE.Mesh).material as THREE.MeshBasicMaterial

    if (c.type === 'ship') {
      if (c.role === 'pirate') mat.color.set(COLORS.pirate)
      else if (c.role === 'police' || c.role === 'escort') mat.color.set(COLORS.police)
      else mat.color.set(COLORS.trader)

      blip.scale.y = size * RADAR_3D.shipYScale
    } else {
      mat.color.set(c.type === 'station' ? COLORS.station : COLORS.planet)
      blip.scale.setScalar(size * RADAR_3D.bodyScale)
    }
  })

  for (let i = bidx; i < blips.length; i++) {
    blips[i].visible = false
  }
}

// Small re-export of role color helper for render code that doesn't want the full config
export { roleColor } from '../config'
