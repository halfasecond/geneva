/**
 * Docked station services panel — replaces the spatial scanner while at port.
 * Typography matches the BOREAL hull nameplate (industrial condensed).
 */

import { BIG_SHIP, DOCKED_RADAR, HULL_LABEL_FONTS } from '../config'

export interface StationServiceRow {
  id: string
  label: string
  status: string
  available: boolean
  active?: boolean
}

export interface DockedRadarDrawOpts {
  stationName: string
  services: StationServiceRow[]
  selectedIndex: number
}

export function firstSelectableServiceIndex(services: StationServiceRow[]): number {
  const i = services.findIndex(s => s.available)
  return i >= 0 ? i : 0
}

export interface DockedServiceActivateResult {
  marketOpen: boolean
  upgradesOpen: boolean
  refuel?: boolean
  undock?: boolean
}

/** Enter on the highlighted row — market / upgrades toggle; others close overlays first. */
export function activateDockedService(
  serviceId: string,
  opts: { marketOpen: boolean; upgradesOpen: boolean },
): DockedServiceActivateResult {
  switch (serviceId) {
    case 'market':
      return { marketOpen: !opts.marketOpen, upgradesOpen: false }
    case 'upgrades':
      return { marketOpen: false, upgradesOpen: !opts.upgradesOpen }
    case 'refuel':
      return { marketOpen: false, upgradesOpen: false, refuel: true }
    case 'news':
      return { marketOpen: false, upgradesOpen: false }
    case 'undock':
      return { marketOpen: false, upgradesOpen: false, undock: true }
    default:
      return { marketOpen: false, upgradesOpen: false }
  }
}

/** Move selection up/down, skipping unavailable rows. */
export function stepDockedServiceIndex(
  services: StationServiceRow[],
  current: number,
  dir: 1 | -1,
): number {
  const selectable = services
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.available)
  if (selectable.length === 0) return current

  const pos = selectable.findIndex(({ i }) => i === current)
  const next = pos < 0
    ? (dir > 0 ? 0 : selectable.length - 1)
    : (pos + dir + selectable.length) % selectable.length
  return selectable[next].i
}

const HULL_FONT = HULL_LABEL_FONTS[BIG_SHIP.nameLabel.font]

function font(size: number, weight = 800) {
  return `${weight} ${size}px ${HULL_FONT}`
}

function drawTrackedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  tracking: number,
) {
  let cx = x
  for (const ch of text) {
    ctx.fillText(ch, cx, y)
    cx += ctx.measureText(ch).width + tracking
  }
}

export function buildDockedStationServices(opts: {
  fuel: number
  fuelMax: number
  marketOpen: boolean
  upgradesOpen: boolean
}): StationServiceRow[] {
  const fuelPct = Math.round((opts.fuel / Math.max(1, opts.fuelMax)) * 100)
  const needsFuel = opts.fuel < opts.fuelMax

  return [
    {
      id: 'refuel',
      label: 'Refuel',
      status: needsFuel ? `${fuelPct}%` : 'FULL',
      available: needsFuel,
    },
    {
      id: 'upgrades',
      label: 'Ship Upgrades',
      status: opts.upgradesOpen ? 'OPEN' : 'POC',
      available: true,
      active: opts.upgradesOpen,
    },
    {
      id: 'market',
      label: 'Market',
      status: opts.marketOpen ? 'OPEN' : 'READY',
      available: true,
      active: opts.marketOpen,
    },
    {
      id: 'news',
      label: 'News',
      status: 'FEED',
      available: true,
    },
    {
      id: 'undock',
      label: 'Undock',
      status: 'READY',
      available: true,
    },
  ]
}

export function drawDockedStationRadar2D(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  opts: DockedRadarDrawOpts,
) {
  const ui = DOCKED_RADAR
  const track = ui.letterSpacing
  const pad = 20

  ctx.fillStyle = ui.bg
  ctx.fillRect(0, 0, w, h)

  ctx.strokeStyle = ui.border
  ctx.lineWidth = 1
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1)

  ctx.textBaseline = 'alphabetic'

  ctx.fillStyle = ui.nameColor
  ctx.font = font(ui.titleSize)
  drawTrackedText(ctx, opts.stationName.toUpperCase(), pad, 34, track * ui.titleSize)

  const listX = pad
  const listStartY = 62
  const rowH = 24

  opts.services.forEach((svc, i) => {
    const y = listStartY + i * rowH
    const active = !!svc.active
    const selected = i === opts.selectedIndex
    const muted = !svc.available && !active

    const label = svc.label

    if (selected && svc.available) {
      ctx.fillStyle = 'rgba(102, 170, 255, 0.12)'
      ctx.fillRect(listX - 6, y - 16, w - pad - listX + 6, rowH - 2)
      ctx.strokeStyle = ui.border
      ctx.lineWidth = 1
      ctx.strokeRect(listX - 6, y - 16, w - pad - listX + 6, rowH - 2)
    }

    ctx.font = font(ui.serviceSize, active || selected ? 800 : 700)
    ctx.fillStyle = active
      ? ui.activeColor
      : selected && svc.available
        ? ui.selectedColor
        : muted
          ? ui.unavailableColor
          : ui.serviceColor

    const textX = selected && svc.available ? listX + 10 : listX
    if (selected && svc.available) {
      ctx.fillText('›', listX, y)
    }

    drawTrackedText(ctx, label.toUpperCase(), textX, y, track * ui.serviceSize)
  })
}