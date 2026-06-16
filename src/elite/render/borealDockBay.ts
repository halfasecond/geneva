/**
 * BOREAL dock bay — standalone always-open station entrance.
 * One bay below each nameplate (starboard + port).
 *
 * Coordinate convention (matches hull nameplate planes):
 *   starboard: rotation.y = π/2   → local +Z points world +X
 *   port:      rotation.y = -π/2  → local +Z points world -X
 *   door width = local X, door height = local Y, depth = local Z
 */

import * as THREE from 'three'
import { BIG_SHIP, BOREAL_DOCK_BAY } from '../config'

/** Bump when layout changes so NPC mesh pools recreate. */
export const BOREAL_DOCK_BAY_VERSION = 12

type DockSide = 'starboard' | 'port'

const HOST_BLOCKS: Record<DockSide, { x: number; y: number; z: number; w: number; h: number; d: number }> = {
  starboard: { x: 14.5, y: 0, z: 2, w: 4.5, h: 16, d: 22 },
  port: { x: -14.5, y: 0, z: 2, w: 4.5, h: 16, d: 22 },
}

const LABEL_Y_FRAC = 0.32

interface GuideSlot {
  mesh: THREE.Mesh
  /** 0–1 position along the chase axis (door width or approach depth). */
  along: number
  kind: 'lip' | 'approach'
}

export interface BorealDockBayHandle {
  root: THREE.Group
  forceField: THREE.Mesh
  side: DockSide
  guides: GuideSlot[]
}

export function createBorealDockBay(scale: number, side: DockSide): BorealDockBayHandle {
  const host = HOST_BLOCKS[side]
  const cfg = BOREAL_DOCK_BAY
  const doorW = host.d * scale * cfg.widthMul
  const doorH = host.h * scale * cfg.heightMul
  const halfW = doorW * 0.5
  const halfH = doorH * 0.5
  const lipD = cfg.lipDepth * scale
  const lipT = cfg.lipThickness * scale
  const outward = cfg.surfaceOffset * scale

  const root = new THREE.Group()
  root.name = `borealDockBay-${side}`
  root.frustumCulled = false

  const lipMat = new THREE.MeshBasicMaterial({ color: cfg.lipColor, depthWrite: false })

  const voidPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(doorW, doorH),
    new THREE.MeshBasicMaterial({ color: cfg.voidColor, depthWrite: false }),
  )
  voidPlane.position.z = outward
  voidPlane.renderOrder = 10
  root.add(voidPlane)

  const lipZ = outward + lipD * 0.5
  const topLip = new THREE.Mesh(new THREE.BoxGeometry(doorW + lipT * 2, lipT, lipD), lipMat)
  topLip.position.set(0, halfH, lipZ)
  topLip.renderOrder = 11
  root.add(topLip)

  const botLip = new THREE.Mesh(new THREE.BoxGeometry(doorW + lipT * 2, lipT, lipD), lipMat)
  botLip.position.set(0, -halfH, lipZ)
  botLip.renderOrder = 11
  root.add(botLip)

  const leftLip = new THREE.Mesh(new THREE.BoxGeometry(lipT, doorH + lipT, lipD), lipMat)
  leftLip.position.set(-halfW, 0, lipZ)
  leftLip.renderOrder = 11
  root.add(leftLip)

  const rightLip = new THREE.Mesh(new THREE.BoxGeometry(lipT, doorH + lipT, lipD), lipMat)
  rightLip.position.set(halfW, 0, lipZ)
  rightLip.renderOrder = 11
  root.add(rightLip)

  const forceField = new THREE.Mesh(
    new THREE.PlaneGeometry(doorW * 0.96, doorH * 0.96),
    new THREE.MeshBasicMaterial({
      color: cfg.forceFieldColor,
      transparent: true,
      opacity: cfg.forceFieldOpacity,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  )
  forceField.position.z = outward + lipD * 1.1
  forceField.renderOrder = 12
  forceField.frustumCulled = false
  root.add(forceField)

  const guides: GuideSlot[] = []
  const guideZ = outward + lipD * 1.45

  const addGuide = (
    size: number,
    x: number,
    y: number,
    z: number,
    along: number,
    kind: GuideSlot['kind'],
  ) => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(size, size),
      new THREE.MeshBasicMaterial({
        color: cfg.guideLightDim,
        depthWrite: false,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.08,
      }),
    )
    mesh.position.set(x, y, z)
    mesh.renderOrder = 13
    mesh.frustumCulled = false
    root.add(mesh)
    guides.push({ mesh, along, kind })
  }

  const lipSize = cfg.guideLightW * scale
  const n = cfg.guideLightsPerEdge

  // Airstrip perimeter: top + bottom rows; chase travels left → right.
  for (let i = 0; i < n; i++) {
    const along = i / Math.max(1, n - 1)
    const x = -halfW + along * doorW
    addGuide(lipSize, x, halfH, guideZ, along, 'lip')
    addGuide(lipSize, x, -halfH, guideZ, along, 'lip')
  }

  const approachSize = cfg.approachGuideW * scale
  const approachN = cfg.approachGuideCount
  const approachLen = host.d * scale * cfg.approachGuideRunwayMul
  const approachStep = approachLen / Math.max(1, approachN)

  for (let i = 1; i <= approachN; i++) {
    const z = guideZ + i * approachStep
    const along = i / approachN
    addGuide(approachSize, -halfW, 0, z, along, 'approach')
    addGuide(approachSize, halfW, 0, z, along, 'approach')
  }

  return { root, forceField, side, guides }
}

export function borealDockBayAttachment(
  scale: number,
  side: DockSide,
): { position: THREE.Vector3; rotation: THREE.Euler } {
  const host = HOST_BLOCKS[side]
  const hw = host.w * 0.5 * scale
  const hh = host.h * 0.5 * scale
  const hullInset = 0.12 * scale
  const labelHalfH = host.h * scale * BIG_SHIP.nameLabel.planeHeightMul * 0.5
  const doorH = host.h * scale * BOREAL_DOCK_BAY.heightMul
  const yLift = LABEL_Y_FRAC * hh
  const doorY = host.y * scale + yLift - labelHalfH - BOREAL_DOCK_BAY.gapBelowLabel * scale - doorH * 0.5

  const position = new THREE.Vector3(
    side === 'starboard'
      ? host.x * scale + hw + hullInset
      : host.x * scale - hw - hullInset,
    doorY,
    host.z * scale,
  )

  const rotation = new THREE.Euler(0, side === 'starboard' ? Math.PI / 2 : -Math.PI / 2, 0)
  return { position, rotation }
}

export function attachBorealDockBay(ship: THREE.Group, scale: number): BorealDockBayHandle[] {
  for (const side of ['starboard', 'port'] as const) {
    const existing = ship.getObjectByName(`borealDockBay-${side}`)
    if (existing) existing.parent?.remove(existing)
  }

  const bays: BorealDockBayHandle[] = []
  for (const side of ['starboard', 'port'] as const) {
    const bay = createBorealDockBay(scale, side)
    const { position, rotation } = borealDockBayAttachment(scale, side)
    bay.root.position.copy(position)
    bay.root.rotation.copy(rotation)
    ship.add(bay.root)
    bays.push(bay)
  }

  ship.userData.borealDockBays = bays
  return bays
}

const litColor = new THREE.Color()
const warmColor = new THREE.Color()
const dimColor = new THREE.Color()

function chaseBrightness(head: number, along: number, trail: number): number {
  let behind = head - along
  if (behind < 0) behind += 1
  if (behind >= trail) return 0
  const t = 1 - behind / trail
  return t * t
}

export function updateBorealDockBay(ship: THREE.Object3D, time: number) {
  const bays = ship.userData.borealDockBays as BorealDockBayHandle[] | undefined
  if (!bays?.length) return

  const cfg = BOREAL_DOCK_BAY
  const lipHead = (time * cfg.airstripFlashHz) % 1
  const approachHead = (time * cfg.approachFlashHz + cfg.approachChaseDelay) % 1
  dimColor.set(cfg.guideLightDim)
  litColor.set(cfg.guideLightLit)
  warmColor.set(cfg.guideLightWarm)

  for (const bay of bays) {
    const ffMat = bay.forceField.material as THREE.MeshBasicMaterial
    ffMat.opacity = cfg.forceFieldOpacity * (0.97 + Math.sin(time * 0.7) * 0.02)

    for (const { mesh, along, kind } of bay.guides) {
      const mat = mesh.material as THREE.MeshBasicMaterial

      if (kind === 'approach') {
        const dip = chaseBrightness(approachHead, along, cfg.airstripTrail)
        const brightness = 1 - dip
        mat.color.copy(dimColor).lerp(litColor, brightness)
        mat.opacity = 0.1 + brightness * 0.9
        continue
      }

      const pulse = chaseBrightness(lipHead, along, cfg.airstripTrail)
      const peak = pulse > 0.82
      mat.color.copy(dimColor).lerp(peak ? litColor : warmColor, pulse)
      mat.opacity = 0.06 + pulse * 0.94
    }
  }
}

export function hasBorealDockBay(ship: THREE.Object3D): boolean {
  return !!ship.getObjectByName('borealDockBay-starboard')
    && !!ship.getObjectByName('borealDockBay-port')
}