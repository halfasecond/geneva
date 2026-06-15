/**
 * 2D cartography map canvas drawing + click picking.
 * Extracted from Elite.tsx — pure functions, no React.
 */

import { COLORS, MAP } from '../config'
import { getCartographyBodies } from '../sim/cartography'
import type { CartographyBody } from '../sim/cartography'

export interface CartographyRoute {
  originId: string
  destinationId: string
}

export interface PlayerMapPos {
  x: number
  y: number
}

export function drawCartographyFrame(
  ctx: CanvasRenderingContext2D,
  size: number,
  mapTime: number,
  route: CartographyRoute,
  playerPos: PlayerMapPos,
) {
  const center = size / 2
  const scale = MAP.scale

  ctx.fillStyle = MAP.background
  ctx.fillRect(0, 0, size, size)

  ctx.strokeStyle = MAP.gridColor
  ctx.lineWidth = 1
  for (let i = -3; i <= 3; i++) {
    const p = center + i * MAP.gridStep
    ctx.beginPath()
    ctx.moveTo(p, 20)
    ctx.lineTo(p, size - 20)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(20, p)
    ctx.lineTo(size - 20, p)
    ctx.stroke()
  }

  const bodies = getCartographyBodies(mapTime * 0.9)
  const bodyMap = new Map(bodies.map(b => [b.id, b]))

  ctx.strokeStyle = `rgba(140, 170, 200, ${MAP.orbitOpacity})`
  ctx.lineWidth = 1.5
  bodies.forEach(b => {
    if (!b.orbitRadius || b.type === 'star') return
    const parent = b.parentId ? bodyMap.get(b.parentId) : null
    const cx = parent ? center + parent.pos2d.x * scale : center
    const cy = parent ? center + parent.pos2d.y * scale : center
    ctx.beginPath()
    ctx.ellipse(cx, cy, b.orbitRadius * scale, b.orbitRadius * scale * 0.72, 0, 0, Math.PI * 2)
    ctx.stroke()
  })

  bodies.forEach(b => {
    const px = center + b.pos2d.x * scale
    const py = center + b.pos2d.y * scale
    const r = Math.max(2.5, b.radius * 1.6 * scale)

    ctx.fillStyle = b.color
    ctx.beginPath()
    ctx.arc(px, py, r, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = COLORS.textMuted
    ctx.font = MAP.bodyLabelFont
    ctx.fillText(b.name, px + r + 3, py - 2)

    if (b.id === route.originId || b.id === route.destinationId) {
      ctx.strokeStyle = b.id === route.destinationId ? MAP.highlightDest : MAP.highlightOrigin
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(px, py, r + 4, 0, Math.PI * 2)
      ctx.stroke()
    }
  })

  drawRouteCurve(ctx, bodyMap, route, center, scale)

  const playerX = center + playerPos.x * scale * 0.65
  const playerY = center + playerPos.y * scale * 0.65
  ctx.fillStyle = MAP.playerColor
  ctx.beginPath()
  ctx.moveTo(playerX, playerY - 6)
  ctx.lineTo(playerX - 4, playerY + 5)
  ctx.lineTo(playerX + 4, playerY + 5)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = MAP.playerDot
  ctx.fillRect(playerX - 1, playerY - 1, 2, 2)
}

function drawRouteCurve(
  ctx: CanvasRenderingContext2D,
  bodyMap: Map<string, CartographyBody>,
  route: CartographyRoute,
  center: number,
  scale: number,
) {
  const origin = bodyMap.get(route.originId)
  const dest = bodyMap.get(route.destinationId)
  if (!origin || !dest) return

  const ox = center + origin.pos2d.x * scale
  const oy = center + origin.pos2d.y * scale
  const dx = center + dest.pos2d.x * scale
  const dy = center + dest.pos2d.y * scale
  const mx = (ox + dx) / 2
  const my = (oy + dy) / 2
  const dist = Math.hypot(dx - ox, dy - oy)
  const bend = Math.min(70, dist * 0.22)
  const nx = -(dy - oy) / (dist || 1)
  const ny = (dx - ox) / (dist || 1)
  const cx = mx + nx * bend
  const cy = my + ny * bend

  ctx.strokeStyle = MAP.routeColor
  ctx.lineWidth = 1.8
  ctx.beginPath()
  ctx.moveTo(ox, oy)
  ctx.quadraticCurveTo(cx, cy, dx, dy)
  ctx.stroke()

  const ang = Math.atan2(dy - cy, dx - cx)
  ctx.fillStyle = MAP.routeColor
  ctx.beginPath()
  ctx.moveTo(dx, dy)
  ctx.lineTo(dx - 9 * Math.cos(ang - 0.5), dy - 9 * Math.sin(ang - 0.5))
  ctx.lineTo(dx - 9 * Math.cos(ang + 0.5), dy - 9 * Math.sin(ang + 0.5))
  ctx.closePath()
  ctx.fill()
}

/** Pick a destination body from a canvas click (map-centred coords). */
export function pickCartographyDestination(
  mx: number,
  my: number,
  elapsedSeconds = 0,
): string | null {
  const scale = MAP.scale
  let best: { id: string; dist: number } | null = null

  getCartographyBodies(elapsedSeconds).forEach(b => {
    if (b.type === 'star') return
    const bx = b.pos2d.x * scale
    const by = b.pos2d.y * scale
    const d = Math.hypot(mx - bx, my - by)
    const hit = Math.max(18, b.radius * 2.2)
    if (d < hit && (!best || d < best.dist)) {
      best = { id: b.id, dist: d }
    }
  })

  return best?.id ?? null
}