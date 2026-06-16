/**
 * Radar glyphs for capital Minds (GSVs) — wide hull bar + mind ring/core.
 */

import type { Contact } from '../sim/contacts'
import { MIND_RADAR, SCANNER_2D } from '../config'

export interface ScannerDisplayPos {
  sx: number
  sy: number
  planeY: number
  distant: boolean
}

export function isMindContact(c: Pick<Contact, 'type' | 'designation' | 'dockBay'>): boolean {
  return c.type === 'ship' && !!c.designation && !c.dockBay
}

/** Dock bay door — wide bar, aim for the force field. */
export function drawDockRadarIcon2D(
  ctx: CanvasRenderingContext2D,
  size: number,
  color = '#66aaff',
) {
  const w = size * 2.5
  const h = size * 0.58
  ctx.fillStyle = 'rgba(6, 14, 28, 0.92)'
  ctx.fillRect(-w * 0.5, -h * 0.5, w, h)
  ctx.strokeStyle = color
  ctx.lineWidth = Math.max(1, size * 0.14)
  ctx.strokeRect(-w * 0.5, -h * 0.5, w, h)
  ctx.fillStyle = '#ffffff'
  const lip = Math.max(1.5, size * 0.18)
  for (let i = 0; i < 4; i++) {
    const t = (i + 0.5) / 4
    ctx.fillRect(-w * 0.5 + t * w - lip * 0.5, -h * 0.5 - lip * 0.15, lip, lip)
    ctx.fillRect(-w * 0.5 + t * w - lip * 0.5, h * 0.5 - lip * 0.85, lip, lip)
  }
}

/** Project a contact onto the 2D angled scanner volume (clamp far depth to the top range line). */
export function scannerDisplayPos2D(
  c: Pick<Contact, 'x' | 'y' | 'z' | 'dist'>,
  cx: number,
  baseY: number,
  pitchRad: number,
): ScannerDisplayPos {
  const maxZ = SCANNER_2D.maxZ * 0.92
  const z = Math.max(0, c.z)
  const distant = z > maxZ
  const displayZ = Math.min(z, maxZ)
  const t = displayZ / Math.max(SCANNER_2D.maxZ, 1)
  const halfW = SCANNER_2D.halfWidthBase * (1 - t * SCANNER_2D.taper)

  const planeY = baseY - displayZ * Math.sin(pitchRad) * SCANNER_2D.depthFactor
  const sy = planeY - c.y * SCANNER_2D.elevFactor
  const rawSx = cx + c.x * SCANNER_2D.latFactor
  const sx = Math.max(cx - halfW, Math.min(cx + halfW, rawSx))

  return { sx, sy, planeY, distant }
}

/** Clamp holo-radar blips to the outer ellipse so distant Minds stay on-scope. */
export function clampHoloRadarPos(x: number, y: number, rx: number, ry: number) {
  const nx = x / rx
  const ny = y / ry
  const mag = Math.hypot(nx, ny)
  if (mag <= 1) return { x, y, distant: false }
  const s = 0.92 / mag
  return { x: x * s, y: y * s, distant: true }
}

/** Wide capital silhouette with mind ring — 2D angled scanner. */
export function drawMindRadarIcon2D(
  ctx: CanvasRenderingContext2D,
  size: number,
  colors: typeof MIND_RADAR.colors = MIND_RADAR.colors,
) {
  const w = size * 2.35
  const h = size * 0.82
  const r = size * 0.2

  ctx.fillStyle = colors.hull2d
  ctx.beginPath()
  ctx.moveTo(-w * 0.5 + r, -h * 0.5)
  ctx.lineTo(w * 0.5 - r, -h * 0.5)
  ctx.quadraticCurveTo(w * 0.5, -h * 0.5, w * 0.5, -h * 0.5 + r)
  ctx.lineTo(w * 0.5, h * 0.5 - r)
  ctx.quadraticCurveTo(w * 0.5, h * 0.5, w * 0.5 - r, h * 0.5)
  ctx.lineTo(-w * 0.5 + r, h * 0.5)
  ctx.quadraticCurveTo(-w * 0.5, h * 0.5, -w * 0.5, h * 0.5 - r)
  ctx.lineTo(-w * 0.5, -h * 0.5 + r)
  ctx.quadraticCurveTo(-w * 0.5, -h * 0.5, -w * 0.5 + r, -h * 0.5)
  ctx.closePath()
  ctx.fill()

  ctx.strokeStyle = colors.ring2d
  ctx.lineWidth = Math.max(1, size * 0.1)
  ctx.beginPath()
  ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2)
  ctx.stroke()

  ctx.fillStyle = colors.core2d
  ctx.beginPath()
  ctx.arc(0, 0, size * 0.16, 0, Math.PI * 2)
  ctx.fill()
}