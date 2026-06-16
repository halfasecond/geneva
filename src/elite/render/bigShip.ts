/**
 * "Big" capital freighter — dark imposing hull silhouettes with Flocker-style
 * city-light windows (warm instanced panes, spaced to avoid overlap).
 */

import * as THREE from 'three'
import { BIG_SHIP, HULL_LABEL_FONTS, NPC } from '../config'
import { attachBorealDockBay, BOREAL_DOCK_BAY_VERSION } from './borealDockBay'

export interface CityLightSlot {
  x: number
  y: number
  z: number
  nx: number
  ny: number
  nz: number
  seed: number
  stable: boolean
  stableLit: boolean
}

type HullFace = 'px' | 'nx' | 'py' | 'ny' | 'pz' | 'nz'

interface HullBlock {
  w: number
  h: number
  d: number
  x: number
  y: number
  z: number
  detailLights?: boolean
  hullLabel?: boolean
  labelFaces?: HullFace[]
  /** Vertical offset on the face as a fraction of half-height (+ = up). */
  labelYFrac?: number
}

export interface BigShipCityLights {
  mesh: THREE.InstancedMesh
  slots: CityLightSlot[]
}

const BASE_BLOCKS: HullBlock[] = [
  { w: 10, h: 4.5, d: 56, x: 0, y: 0, z: 0 },
  { w: 24, h: 7.5, d: 38, x: 0, y: 6.2, z: -3 },
  { w: 24, h: 7.5, d: 38, x: 0, y: -6.2, z: -3 },
  { w: 8, h: 10, d: 14, x: 0, y: 0, z: 30 },
  { w: 14, h: 6.5, d: 18, x: 0, y: 0, z: -32 },
  { w: 4.5, h: 16, d: 22, x: 14.5, y: 0, z: 2, hullLabel: true, labelFaces: ['px'], labelYFrac: 0.32 },
  { w: 4.5, h: 16, d: 22, x: -14.5, y: 0, z: 2, hullLabel: true, labelFaces: ['nx'], labelYFrac: 0.32 },
]

const BASE_DETAIL_BLOCKS: HullBlock[] = [
  { w: 3, h: 2.5, d: 4, x: 0, y: 2.2, z: 33.5 },
  { w: 2, h: 9, d: 2.2, x: 7.2, y: 5, z: 16 },
  { w: 6, h: 3.2, d: 5.5, x: -9, y: -1.2, z: -27 },
  { w: 5, h: 2.2, d: 3.5, x: 13.8, y: 9.2, z: 4 },
  { w: 4, h: 1.8, d: 8, x: 0, y: -8.5, z: -20, detailLights: true },
]

function scaleBlocks(scale: number): HullBlock[] {
  const all = [...BASE_BLOCKS, ...BASE_DETAIL_BLOCKS]
  return all.map(b => ({
    w: b.w * scale,
    h: b.h * scale,
    d: b.d * scale,
    x: b.x * scale,
    y: b.y * scale,
    z: b.z * scale,
    detailLights: b.detailLights,
    hullLabel: b.hullLabel,
    labelFaces: b.labelFaces,
    labelYFrac: b.labelYFrac,
  }))
}

export const BIG_SHIP_MESH_VERSION = BOREAL_DOCK_BAY_VERSION

function fitHullLabelFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  stack: string,
  targetWidth: number,
  letterSpacing: number,
) {
  let fontSize = 420
  while (fontSize > 12) {
    ctx.font = `800 ${fontSize}px ${stack}`
    const metrics = ctx.measureText(text)
    const spacingExtra = letterSpacing * fontSize * Math.max(0, text.length - 1)
    if (metrics.width + spacingExtra <= targetWidth) return fontSize
    fontSize -= 6
  }
  return 12
}

function createHullLabelTexture(
  text: string,
  color: string,
  opacity: number,
  fontKey: keyof typeof HULL_LABEL_FONTS,
  letterSpacing: number,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  canvas.width = 2048
  canvas.height = 512

  const stack = HULL_LABEL_FONTS[fontKey]
  const fontSize = fitHullLabelFontSize(ctx, text, stack, canvas.width * 0.92, letterSpacing)

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.font = `800 ${fontSize}px ${stack}`
  ctx.fillStyle = color
  ctx.globalAlpha = opacity
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  if (letterSpacing > 0 && 'letterSpacing' in ctx) {
    ctx.letterSpacing = `${letterSpacing * fontSize}px`
  }
  ctx.fillText(text, canvas.width / 2, canvas.height / 2)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function addHullLabelFace(
  group: THREE.Group,
  block: HullBlock,
  face: HullFace,
  tex: THREE.CanvasTexture,
  scale: number,
  widthMul: number,
  heightMul: number,
) {
  const hw = block.w * 0.5
  const hh = block.h * 0.5
  const hd = block.d * 0.5
  const inset = 0.12 * scale
  const yLift = (block.labelYFrac ?? 0) * hh

  let planeW = block.w * widthMul
  let planeH = block.h * heightMul
  const pos = new THREE.Vector3(block.x, block.y + yLift, block.z)
  const rot = new THREE.Euler(0, 0, 0)

  if (face === 'px') {
    pos.x += hw + inset
    planeW = block.d * widthMul
    planeH = block.h * heightMul
    rot.y = Math.PI / 2
  } else if (face === 'nx') {
    pos.x -= hw + inset
    planeW = block.d * widthMul
    planeH = block.h * heightMul
    rot.y = -Math.PI / 2
  } else if (face === 'py') {
    pos.y += hh + inset
    planeW = block.w * widthMul
    planeH = block.d * heightMul
    rot.x = -Math.PI / 2
  } else if (face === 'ny') {
    pos.y -= hh + inset
    planeW = block.w * widthMul
    planeH = block.d * heightMul
    rot.x = Math.PI / 2
  } else if (face === 'pz') {
    pos.z += hd + inset
    planeW = block.w * widthMul
    planeH = block.h * heightMul
  } else {
    pos.z -= hd + inset
    planeW = block.w * widthMul
    planeH = block.h * heightMul
    rot.y = Math.PI
  }

  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(planeW, planeH),
    new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  )
  label.position.copy(pos)
  label.rotation.copy(rot)
  label.renderOrder = 1
  group.add(label)
}

function addHullLabels(
  group: THREE.Group,
  block: HullBlock,
  tex: THREE.CanvasTexture,
  scale: number,
  widthMul: number,
  heightMul: number,
) {
  const faces = block.labelFaces ?? ['px']
  for (const face of faces) {
    addHullLabelFace(group, block, face, tex, scale, widthMul, heightMul)
  }
}

function fract(n: number) {
  return n - Math.floor(n)
}

function hash2(a: number, b: number) {
  return fract(Math.sin(a * 12.9898 + b * 78.233) * 43758.5453)
}

/** Fit a grid to the face without pane overlap. */
function faceGridDims(
  faceW: number,
  faceH: number,
  paneW: number,
  paneH: number,
  gap: number,
) {
  const cols = Math.max(1, Math.floor(faceW / (paneW * gap)))
  const rows = Math.max(1, Math.floor(faceH / (paneH * gap)))
  return { cols, rows }
}

function addFaceGrid(
  slots: CityLightSlot[],
  origin: { x: number; y: number; z: number },
  face: 'px' | 'nx' | 'py' | 'ny',
  faceW: number,
  faceH: number,
  cols: number,
  rows: number,
  surfaceInset: number,
  stableFraction: number,
) {
  const { x: ox, y: oy, z: oz } = origin
  const cellW = faceW / cols
  const cellH = faceH / rows

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const u = (col + 0.5) * cellW - faceW * 0.5
      const v = (row + 0.5) * cellH - faceH * 0.5
      const seed = hash2(col + ox * 0.01, row + oz * 0.007)
      const stable = seed < stableFraction
      const stableLit = seed > 0.14

      let x = ox
      let y = oy
      let z = oz
      let nx = 0
      let ny = 0
      let nz = 0

      if (face === 'px') {
        x = ox + surfaceInset
        y = oy + v
        z = oz + u
        nx = 1
      } else if (face === 'nx') {
        x = ox - surfaceInset
        y = oy + v
        z = oz + u
        nx = -1
      } else if (face === 'py') {
        x = ox + u
        y = oy + surfaceInset
        z = oz + v
        ny = 1
      } else {
        x = ox + u
        y = oy - surfaceInset
        z = oz + v
        ny = -1
      }

      // Nudge along normal to prevent z-fighting on the hull.
      const lift = surfaceInset * 0.35 * (0.5 + seed * 0.5)
      x += nx * lift
      y += ny * lift
      z += nz * lift

      slots.push({ x, y, z, nx, ny, nz, seed, stable, stableLit })
    }
  }
}

function buildWindowSlots(
  blocks: HullBlock[],
  scale: number,
  paneW: number,
  paneH: number,
  gap: number,
  stableFraction: number,
): CityLightSlot[] {
  const slots: CityLightSlot[] = []
  const inset = 0.08 * scale

  for (const b of blocks) {
    const hw = b.w * 0.5
    const hh = b.h * 0.5

    if (b.detailLights) {
      const faceW = b.d * 0.88
      const faceH = b.h * 0.8
      const { cols, rows } = faceGridDims(faceW, faceH, paneW, paneH, gap)
      addFaceGrid(slots, { x: b.x + hw * 0.85, y: b.y, z: b.z }, 'px', faceW, faceH, cols, rows, inset, stableFraction)
      continue
    }

    if (b.w >= 14 * scale) {
      const faceW = b.d * 0.92
      const faceH = b.h * 0.82
      const { cols, rows } = faceGridDims(faceW, faceH, paneW, paneH, gap)
      addFaceGrid(slots, { x: b.x + hw, y: b.y, z: b.z }, 'px', faceW, faceH, cols, rows, inset, stableFraction)
      addFaceGrid(slots, { x: b.x - hw, y: b.y, z: b.z }, 'nx', faceW, faceH, cols, rows, inset, stableFraction)
    }

    if (b.d >= 30 * scale) {
      const faceW = b.w * 0.88
      const faceH = b.d * 0.86
      const { cols, rows } = faceGridDims(faceW, faceH, paneW, paneH, gap)
      addFaceGrid(slots, { x: b.x, y: b.y + hh, z: b.z }, 'py', faceW, faceH, cols, rows, inset, stableFraction)
      addFaceGrid(slots, { x: b.x, y: b.y - hh, z: b.z }, 'ny', faceW, faceH, cols, rows, inset, stableFraction)
    }

    if (b.h >= 8 * scale && b.d < 20 * scale) {
      const faceW = b.d * 0.7
      const faceH = b.h * 0.85
      const { cols, rows } = faceGridDims(faceW, faceH, paneW, paneH, gap)
      addFaceGrid(slots, { x: b.x + hw * 0.7, y: b.y, z: b.z }, 'px', faceW, faceH, cols, rows, inset, stableFraction)
      addFaceGrid(slots, { x: b.x - hw * 0.7, y: b.y, z: b.z }, 'nx', faceW, faceH, cols, rows, inset, stableFraction)
    }
  }

  return slots
}

/** Procedural capital hull + instanced city-light panes. */
export function createBigShipMesh(): THREE.Group {
  const group = new THREE.Group()
  group.userData.shipDesign = 'big'

  const scale = BIG_SHIP.scale
  const { w: paneW, h: paneH, gap, stableFraction } = BIG_SHIP.window
  const blocks = scaleBlocks(scale)
  const hullMat = new THREE.MeshBasicMaterial({ color: BIG_SHIP.hullColor })
  const detailMat = new THREE.MeshBasicMaterial({ color: BIG_SHIP.detailHullColor })

  const {
    text: labelText,
    color: labelColor,
    opacity: labelOpacity,
    font: labelFont,
    letterSpacing: labelLetterSpacing,
    planeWidthMul,
    planeHeightMul,
  } = BIG_SHIP.nameLabel
  const labelTex = createHullLabelTexture(
    labelText,
    labelColor,
    labelOpacity,
    labelFont,
    labelLetterSpacing,
  )

  for (const b of blocks) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(b.w, b.h, b.d),
      b.detailLights ? detailMat : hullMat,
    )
    mesh.position.set(b.x, b.y, b.z)
    group.add(mesh)

    if (b.hullLabel) {
      addHullLabels(group, b, labelTex, scale, planeWidthMul, planeHeightMul)
    }
  }

  attachBorealDockBay(group, scale)
  group.userData.meshVersion = BIG_SHIP_MESH_VERSION

  const slots = buildWindowSlots(blocks, scale, paneW, paneH, gap, stableFraction)
  const lightGeo = new THREE.PlaneGeometry(paneW, paneH)
  const lightMat = new THREE.MeshBasicMaterial({
    color: BIG_SHIP.window.litColor,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
  const lights = new THREE.InstancedMesh(lightGeo, lightMat, slots.length)
  lights.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  lights.frustumCulled = false
  lights.renderOrder = 2

  const dummy = new THREE.Object3D()
  const dim = new THREE.Color(BIG_SHIP.window.dimColor.r, BIG_SHIP.window.dimColor.g, BIG_SHIP.window.dimColor.b)

  const warm = new THREE.Color(BIG_SHIP.window.litColor)
  slots.forEach((slot, i) => {
    dummy.position.set(slot.x, slot.y, slot.z)
    dummy.lookAt(slot.x + slot.nx, slot.y + slot.ny, slot.z + slot.nz)
    dummy.updateMatrix()
    lights.setMatrixAt(i, dummy.matrix)
    if (slot.stable) {
      lights.setColorAt(i, slot.stableLit ? warm : dim)
    } else {
      lights.setColorAt(i, dim)
    }
  })

  lights.count = slots.length
  lights.instanceMatrix.needsUpdate = true
  if (lights.instanceColor) lights.instanceColor.needsUpdate = true
  group.add(lights)

  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(NPC.dot.r * 1.2, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffee66, transparent: true, opacity: NPC.dot.opacity }),
  )
  dot.position.y = BIG_SHIP.pressureDotY
  dot.visible = false
  group.add(dot)

  group.userData.cityLights = { mesh: lights, slots } satisfies BigShipCityLights

  return group
}

function cityLightColor(lit: boolean, intensity: number, layerBias: number): THREE.Color {
  const color = new THREE.Color()
  if (!lit) {
    return color.setRGB(0.05 + layerBias, 0.06 + layerBias, 0.09 + layerBias * 0.5)
  }
  const depth = 0.78 + layerBias * 0.12
  return color.setRGB(
    (0.62 + intensity * 0.38) * depth,
    (0.48 + intensity * 0.42) * depth,
    (0.18 + intensity * 0.2) * depth,
  )
}

/** Stable panes never update; only the small flickering subset animates. */
export function updateBigShipCityLights(group: THREE.Object3D, time: number, shipId: number) {
  const data = group.userData.cityLights as BigShipCityLights | undefined
  if (!data) return

  const { mesh, slots } = data
  const { activity, flickerHz } = BIG_SHIP.window
  let changed = false

  slots.forEach((slot, i) => {
    if (slot.stable) return

    const phase = slot.seed * Math.PI * 2 + shipId * 0.41
    const layerBias = Math.min(0.04, Math.abs(slot.y) * 0.00004)
    const rhythm = Math.sin(time * flickerHz * Math.PI * 2 + phase)
    const tenancy = 0.55 + slot.seed * 0.4
    const lit = rhythm * 0.5 + 0.5 > 1 - tenancy * activity
    const intensity = lit ? 0.52 + Math.sin(time * 0.5 + phase) * 0.08 : 0

    mesh.setColorAt(i, cityLightColor(lit, intensity, layerBias))
    changed = true
  })

  if (changed && mesh.instanceColor) mesh.instanceColor.needsUpdate = true
}

export function isBigShipMesh(mesh: THREE.Object3D): boolean {
  return mesh.userData.shipDesign === 'big'
}