import { useEffect, type MutableRefObject, type RefObject } from 'react'
import {
  FUEL,
  MIND_RADAR,
  SCANNER_2D,
  roleCss,
} from './config'
import {
  buildDockedStationServices,
  drawDockedStationRadar2D,
  firstSelectableServiceIndex,
} from './render/dockedRadar'
import { drawDockRadarIcon2D, drawMindRadarIcon2D, isMindContact, scannerDisplayPos2D } from './render/radarIcons'
import { isDockContact, projectContacts } from './sim/contacts'
import type { EliteSnapshot } from './sim/core/types'
import { getBodyById, getFrozenCartographyBodies } from './sim/cartography'
import { bodyLocalPos } from './sim/systemSpace'

interface UseRadar2DOptions {
  canvasRef: RefObject<HTMLCanvasElement | null>
  snapRef: MutableRefObject<EliteSnapshot | null>
  marketOpenRef: MutableRefObject<boolean>
  upgradesOpenRef: MutableRefObject<boolean>
  hangarOpenRef: MutableRefObject<boolean>
  dockedServiceIndexRef: MutableRefObject<number>
  mapOpen: boolean
}

/** Side-on angled 2D scanner in the bottom dashboard. */
export function useRadar2D({
  canvasRef,
  snapRef,
  marketOpenRef,
  upgradesOpenRef,
  hangarOpenRef,
  dockedServiceIndexRef,
  mapOpen,
}: UseRadar2DOptions) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf: number
    const drawRadar = () => {
      const W = canvas.width
      const H = canvas.height
      const cx = W * 0.5
      const baseY = H * SCANNER_2D.baseYFactor
      const pitchRad = SCANNER_2D.pitchDeg * Math.PI / 180
      const depthFactor = SCANNER_2D.depthFactor

      ctx.fillStyle = 'rgba(0,0,0,0.78)'
      ctx.fillRect(0, 0, W, H)

      ctx.strokeStyle = SCANNER_2D.gridColor
      ctx.lineWidth = 1
      const numLines = SCANNER_2D.numRangeLines
      for (let i = 0; i <= numLines; i++) {
        const t = i / numLines
        const z = t * SCANNER_2D.maxZ
        const y = baseY - z * Math.sin(pitchRad) * depthFactor
        const halfW = SCANNER_2D.halfWidthBase * (1 - t * SCANNER_2D.taper)
        ctx.beginPath()
        ctx.moveTo(cx - halfW, y)
        ctx.lineTo(cx + halfW, y)
        ctx.stroke()
      }

      ctx.beginPath()
      ctx.moveTo(cx - SCANNER_2D.wallBaseHalfW, baseY)
      ctx.lineTo(cx - SCANNER_2D.wallTopHalfW, baseY - SCANNER_2D.sideWallZ * Math.sin(pitchRad) * depthFactor)
      ctx.moveTo(cx + SCANNER_2D.wallBaseHalfW, baseY)
      ctx.lineTo(cx + SCANNER_2D.wallTopHalfW, baseY - SCANNER_2D.sideWallZ * Math.sin(pitchRad) * depthFactor)
      ctx.stroke()

      ctx.strokeStyle = SCANNER_2D.brightColor
      ctx.lineWidth = 1.6
      ctx.beginPath()
      ctx.moveTo(cx - SCANNER_2D.brightPlaneHalfW, baseY)
      ctx.lineTo(cx + SCANNER_2D.brightPlaneHalfW, baseY)
      ctx.stroke()

      ctx.fillStyle = SCANNER_2D.playerColor
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(cx, baseY - SCANNER_2D.chevron.back)
      ctx.lineTo(cx - SCANNER_2D.chevron.side, baseY + SCANNER_2D.chevron.fwd)
      ctx.lineTo(cx + SCANNER_2D.chevron.side, baseY + SCANNER_2D.chevron.fwd)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = SCANNER_2D.playerColor
      ctx.beginPath()
      ctx.moveTo(cx - 6, baseY + 4)
      ctx.lineTo(cx, baseY - 4)
      ctx.lineTo(cx + 6, baseY + 4)
      ctx.stroke()

      const p = snapRef.current?.player
      if (!p) {
        raf = requestAnimationFrame(drawRadar)
        return
      }

      if (p.flightMode === 'docked' && p.dockedAtStationId) {
        const body = getBodyById(p.dockedAtStationId, 'frozen')
        const dockedServices = buildDockedStationServices({
          fuel: p.fuel ?? FUEL.starting,
          fuelMax: FUEL.max,
          marketOpen: marketOpenRef.current,
          upgradesOpen: upgradesOpenRef.current,
          hangarOpen: hangarOpenRef.current,
        })
        if (!dockedServices[dockedServiceIndexRef.current]?.available) {
          dockedServiceIndexRef.current = firstSelectableServiceIndex(dockedServices)
        }
        drawDockedStationRadar2D(ctx, W, H, {
          stationName: body?.name ?? 'Station',
          services: dockedServices,
          selectedIndex: dockedServiceIndexRef.current,
        })
        raf = requestAnimationFrame(drawRadar)
        return
      }

      const fwd = p.heading
      const upv = p.up || { x: 0, y: 1, z: 0 }
      const carto = getFrozenCartographyBodies()
      const sys2d = p.systemPos2d
      const radarBodies = carto
        .filter(b => b.type !== 'star')
        .map(b => ({
          id: b.id,
          name: b.name,
          type: b.type,
          pos3d: bodyLocalPos(b, sys2d),
        }))

      const contacts = projectContacts(
        { pos: p.pos, heading: fwd, up: upv },
        snapRef.current?.npcs || [],
        radarBodies,
        { maxShip: SCANNER_2D.maxRangeShip, maxBody: SCANNER_2D.maxRangeBody, maxMind: MIND_RADAR.maxRange },
      )

      contacts.forEach((c) => {
        const { sx, sy, planeY, distant } = scannerDisplayPos2D(c, cx, baseY, pitchRad)
        const size = Math.max(SCANNER_2D.sizeFar, SCANNER_2D.sizeNear * (1 - Math.min(1, c.dist / SCANNER_2D.sizeDistDiv)))

        if (Math.abs(c.y) > 5) {
          ctx.strokeStyle = SCANNER_2D.elevationStickColor
          ctx.lineWidth = 1.2
          ctx.beginPath()
          ctx.moveTo(sx, planeY)
          ctx.lineTo(sx, sy)
          ctx.stroke()
        }

        if (c.type === 'ship') {
          ctx.save()
          ctx.translate(sx, sy)
          if (isMindContact(c)) {
            if (distant) ctx.globalAlpha = 0.72
            drawMindRadarIcon2D(ctx, size * MIND_RADAR.sizeMul2d)
            if (distant) ctx.globalAlpha = 1
          } else {
            const shipSize = size
            ctx.fillStyle = roleCss(c.role)
            ctx.beginPath()
            ctx.moveTo(0, -shipSize)
            ctx.lineTo(-shipSize * 0.48, shipSize * 0.38)
            ctx.lineTo(0, shipSize * 0.12)
            ctx.lineTo(shipSize * 0.48, shipSize * 0.38)
            ctx.closePath()
            ctx.fill()
          }
          ctx.restore()
        } else if (isDockContact(c)) {
          ctx.save()
          ctx.translate(sx, sy)
          if (distant) ctx.globalAlpha = 0.82
          drawDockRadarIcon2D(ctx, size * 1.15)
          if (distant) ctx.globalAlpha = 1
          ctx.restore()
        } else {
          ctx.fillStyle = c.type === 'station' ? SCANNER_2D.stationColor : SCANNER_2D.planetColor
          ctx.beginPath()
          ctx.arc(sx, sy, size * (c.type === 'station' ? 1.08 : 0.82), 0, Math.PI * 2)
          ctx.fill()
          if (c.type === 'station') {
            ctx.strokeStyle = '#ffffff'
            ctx.lineWidth = 0.7
            ctx.beginPath()
            ctx.moveTo(sx - size * 0.38, sy)
            ctx.lineTo(sx + size * 0.38, sy)
            ctx.moveTo(sx, sy - size * 0.38)
            ctx.lineTo(sx, sy + size * 0.38)
            ctx.stroke()
            ctx.lineWidth = 1
          }
        }

        if (isMindContact(c) && c.dist < MIND_RADAR.labelDist) {
          ctx.fillStyle = MIND_RADAR.colors.ring2d
          ctx.font = 'bold 9px monospace'
          ctx.fillText(c.designation ?? c.name ?? 'MIND', sx + size * 2.2, sy - 5)
        }
        if (isDockContact(c) && c.dist < MIND_RADAR.labelDist) {
          ctx.fillStyle = '#66aaff'
          ctx.font = 'bold 9px monospace'
          ctx.fillText(c.name ?? 'DOCK', sx + size * 2.4, sy - 5)
        }
        if (c.dist < SCANNER_2D.labelDist) {
          ctx.fillStyle = SCANNER_2D.labelColor
          ctx.font = '8px monospace'
          const mind = isMindContact(c)
          const dock = isDockContact(c)
          ctx.fillText(
            Math.round(c.dist).toString(),
            mind || dock ? sx + size * 2.2 : sx + size + 6,
            mind || dock ? sy + 6 : sy + 3,
          )
        }
      })

      raf = requestAnimationFrame(drawRadar)
    }

    drawRadar()
    return () => { if (raf) cancelAnimationFrame(raf) }
  }, [canvasRef, snapRef, marketOpenRef, upgradesOpenRef, hangarOpenRef, dockedServiceIndexRef, mapOpen])
}