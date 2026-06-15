/**
 * 2D cartography map canvas drawing + click picking.
 * Fullscreen windscreen overlay — Flocker-inspired visuals.
 */

import { MAP } from '../config'
import { getFrozenCartographyBodies, getMapCartographyBodies } from '../sim/cartography'
import type { CartographyBody } from '../sim/cartography'

export interface CartographyRoute {
  originId: string
  destinationId: string
}

export interface PlayerMapPos {
  x: number
  y: number
}

/** Scale orbital layout to fit the viewport (Flocker fills the windscreen). */
export function mapScaleForViewport(width: number, height: number): number {
  const minDim = Math.min(width, height)
  return (minDim * 0.42) / 320
}

export function drawCartographyFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  route: CartographyRoute,
  playerPos: PlayerMapPos,
) {
  const cx = width / 2
  const cy = height / 2
  const scale = mapScaleForViewport(width, height)

  ctx.fillStyle = MAP.windscreenBg
  ctx.fillRect(0, 0, width, height)

  // Sparse star field
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)'
  for (let i = 0; i < 120; i++) {
    const sx = ((i * 97 + 13) % 1000) / 1000 * width
    const sy = ((i * 53 + 7) % 1000) / 1000 * height
    const sr = (i % 3 === 0) ? 1.2 : 0.6
    ctx.beginPath()
    ctx.arc(sx, sy, sr, 0, Math.PI * 2)
    ctx.fill()
  }

  const bodies = getMapCartographyBodies()
  const bodyMap = new Map(bodies.map(b => [b.id, b]))

  // Orbit rings — thin, pale (matches flockers.halfasecond.com)
  ctx.strokeStyle = MAP.orbitStroke
  ctx.lineWidth = 1
  bodies.forEach(b => {
    if (!b.orbitRadius || b.type === 'star') return
    const parent = b.parentId ? bodyMap.get(b.parentId) : null
    const ox = parent ? cx + parent.pos2d.x * scale : cx
    const oy = parent ? cy + parent.pos2d.y * scale : cy
    ctx.beginPath()
    ctx.ellipse(ox, oy, b.orbitRadius * scale, b.orbitRadius * scale * 0.72, 0, 0, Math.PI * 2)
    ctx.stroke()
  })

  // Central star glow
  const star = bodies.find(b => b.type === 'star')
  if (star) {
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 28 * scale)
    grad.addColorStop(0, 'rgba(255, 230, 163, 0.95)')
    grad.addColorStop(0.4, 'rgba(255, 200, 80, 0.35)')
    grad.addColorStop(1, 'rgba(255, 200, 80, 0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(cx, cy, 28 * scale, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ffe6a3'
    ctx.beginPath()
    ctx.arc(cx, cy, Math.max(4, star.radius * scale * 0.5), 0, Math.PI * 2)
    ctx.fill()
  }

  // Bodies — no on-map labels (Flocker uses sidebar only)
  bodies.forEach(b => {
    if (b.type === 'star') return
    const px = cx + b.pos2d.x * scale
    const py = cy + b.pos2d.y * scale
    const r = Math.max(3, b.radius * 1.4 * scale)

    ctx.fillStyle = b.color
    ctx.beginPath()
    ctx.arc(px, py, r, 0, Math.PI * 2)
    ctx.fill()

    if (b.type === 'station') {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
      ctx.lineWidth = 0.8
      ctx.beginPath()
      ctx.moveTo(px - r * 0.7, py)
      ctx.lineTo(px + r * 0.7, py)
      ctx.moveTo(px, py - r * 0.7)
      ctx.lineTo(px, py + r * 0.7)
      ctx.stroke()
    }

    if (b.id === route.originId || b.id === route.destinationId) {
      ctx.strokeStyle = b.id === route.destinationId ? MAP.highlightDest : MAP.highlightOrigin
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(px, py, r + 5, 0, Math.PI * 2)
      ctx.stroke()
    }
  })

  drawRouteCurve(ctx, bodyMap, route, cx, cy, scale)

  // Player marker
  const playerX = cx + playerPos.x * scale
  const playerY = cy + playerPos.y * scale
  ctx.fillStyle = MAP.playerColor
  ctx.beginPath()
  ctx.moveTo(playerX, playerY - 7)
  ctx.lineTo(playerX - 5, playerY + 6)
  ctx.lineTo(playerX + 5, playerY + 6)
  ctx.closePath()
  ctx.fill()
}

function drawRouteCurve(
  ctx: CanvasRenderingContext2D,
  bodyMap: Map<string, CartographyBody>,
  route: CartographyRoute,
  cx: number,
  cy: number,
  scale: number,
) {
  const origin = bodyMap.get(route.originId)
  const dest = bodyMap.get(route.destinationId)
  if (!origin || !dest) return

  const ox = cx + origin.pos2d.x * scale
  const oy = cy + origin.pos2d.y * scale
  const dx = cx + dest.pos2d.x * scale
  const dy = cy + dest.pos2d.y * scale
  const mx = (ox + dx) / 2
  const my = (oy + dy) / 2
  const dist = Math.hypot(dx - ox, dy - oy)
  const bend = Math.min(85, dist * 0.18)
  const nx = -(dy - oy) / (dist || 1)
  const ny = (dx - ox) / (dist || 1)
  const qx = mx + nx * bend
  const qy = my + ny * bend

  ctx.strokeStyle = MAP.routeColor
  ctx.lineWidth = 1.6
  ctx.globalAlpha = 0.75
  ctx.beginPath()
  ctx.moveTo(ox, oy)
  ctx.quadraticCurveTo(qx, qy, dx, dy)
  ctx.stroke()
  ctx.globalAlpha = 1

  const ang = Math.atan2(dy - qy, dx - qx)
  ctx.fillStyle = MAP.routeColor
  ctx.beginPath()
  ctx.moveTo(dx, dy)
  ctx.lineTo(dx - 10 * Math.cos(ang - 0.45), dy - 10 * Math.sin(ang - 0.45))
  ctx.lineTo(dx - 10 * Math.cos(ang + 0.45), dy - 10 * Math.sin(ang + 0.45))
  ctx.closePath()
  ctx.fill()
}

/** Pick a destination body from a canvas click (map-centred coords). */
export function pickCartographyDestination(
  mx: number,
  my: number,
  scale: number,
): string | null {
  let best: { id: string; dist: number } | null = null

  getFrozenCartographyBodies().forEach(b => {
    if (b.type === 'star') return
    const bx = b.pos2d.x * scale
    const by = b.pos2d.y * scale
    const d = Math.hypot(mx - bx, my - by)
    const hit = Math.max(22, b.radius * 2.8 * scale)
    if (d < hit && (!best || d < best.dist)) {
      best = { id: b.id, dist: d }
    }
  })

  return best?.id ?? null
}