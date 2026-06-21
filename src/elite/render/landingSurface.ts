/**
 * Flat landing pad — body-coloured ground plane with procedural craters.
 * Shown while landed (replaces the nearby planet holo sphere).
 */

import * as THREE from 'three'
import { LAND } from '../config'

function hashSeed(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shadeHex(hex: string, factor: number): string {
  const c = new THREE.Color(hex)
  c.r *= factor
  c.g *= factor
  c.b *= factor
  return `#${c.getHexString()}`
}

export function createLandingSurfaceTexture(color: string, bodyId: string): THREE.CanvasTexture {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return new THREE.CanvasTexture(canvas)
  }

  ctx.fillStyle = color
  ctx.fillRect(0, 0, size, size)

  const rand = mulberry32(hashSeed(bodyId))
  const craterCount = 10 + Math.floor(rand() * 8)
  const rim = shadeHex(color, 0.72)
  const floor = shadeHex(color, 0.48)

  for (let i = 0; i < craterCount; i++) {
    const cx = rand() * size
    const cy = rand() * size
    const rx = 14 + rand() * 42
    const ry = rx * (0.72 + rand() * 0.35)

    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(rand() * Math.PI)
    ctx.beginPath()
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2)
    ctx.fillStyle = floor
    ctx.fill()
    ctx.lineWidth = 1.5 + rand() * 2
    ctx.strokeStyle = rim
    ctx.stroke()
    ctx.restore()
  }

  // Subtle grain so the flat colour isn't a perfect fill.
  for (let i = 0; i < 120; i++) {
    const x = rand() * size
    const y = rand() * size
    const r = 0.6 + rand() * 1.8
    ctx.fillStyle = shadeHex(color, 0.88 + rand() * 0.1)
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(3, 3)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function createLandingSurfaceMesh(color: string, bodyId: string): THREE.Mesh {
  const tex = createLandingSurfaceTexture(color, bodyId)
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(LAND.surfacePlaneSize, LAND.surfacePlaneSize),
    new THREE.MeshBasicMaterial({
      map: tex,
      fog: false,
      side: THREE.DoubleSide,
    }),
  )
  mesh.rotation.x = -Math.PI / 2
  mesh.userData.landingBodyId = bodyId
  return mesh
}

export function updateLandingSurfaceMesh(
  mesh: THREE.Mesh,
  color: string,
  bodyId: string,
): void {
  if (mesh.userData.landingBodyId === bodyId) return
  const oldMat = mesh.material as THREE.MeshBasicMaterial
  oldMat.map?.dispose()
  oldMat.dispose()
  mesh.material = new THREE.MeshBasicMaterial({
    map: createLandingSurfaceTexture(color, bodyId),
    fog: false,
    side: THREE.DoubleSide,
  })
  mesh.userData.landingBodyId = bodyId
}

/** Anchor the pad under the landed ship — horizontal XZ plane. */
export function positionLandingSurface(
  mesh: THREE.Mesh,
  playerPos: { x: number; y: number; z: number },
): void {
  mesh.position.set(playerPos.x, playerPos.y - 10, playerPos.z + 24)
}