/**
 * Elite config - single source of truth for magic numbers, colors, sizes and tuning.
 * Extracted during the "tighten the code" pass so future changes (radars, cockpit,
 * hyperspace, panels) touch one place and the visual/behavior stays consistent.
 *
 * Grouped for easy scanning. Values taken from the original working cockpit implementation.
 */

// =============================================================================
// COLORS (Three.js numbers + CSS strings where both are used)
// =============================================================================
export const COLORS = {
  spaceBg: 0x00040a,

  // Classic Elite holo orange / amber
  holoPrimary: 0x00aaff,

  // VECH / cyan-blue accents
  vechRing: 0x66aaff,
  vechRingCss: '#66aaff',

  // NPC / contact glyphs
  trader: 0xaabbcc,
  pirate: 0xff6b6b,
  police: 0x6bffa3,
  escort: 0x88ddff,
  pirateCss: '#ff6b6b',
  policeCss: '#6bffa3',
  escortCss: '#88ddff',
  neutralCss: '#ffee44',

  // Bodies (planets/stations)
  station: 0x88ddff,
  planet: 0xaaccff,

  // UI / panels
  panelBorder: '#00aaff',
  panelBg: 'rgba(4, 12, 22, 0.55)',
  textMuted: '#aaccdd',
  warning: 0xff4444,
} as const

// =============================================================================
// COCKPIT 3D (attached to camera for "inside the ship" first-person feel)
// =============================================================================
export const COCKPIT = {
  // Clone of the simple ship model placed in view
  position: { x: 0, y: -2.8, z: -6.5 },
  scale: 0.85,
  rotationX: 0.35,

  // Canopy ring
  canopyRadiusX: 3.8,
  canopyRadiusY: 3.1,
  canopyZ: -2.2,
  canopyYOffset: -0.8,

  // Interior dashboard / walls (lite 3D framing)
  consoleBase: { pos: { x: 0, y: -1.8, z: -3 }, size: { x: 5, y: 0.4, z: 1 } },
  sideConsole: { width: 1.5, height: 2, depth: 0.3, x: 2.5, y: -0.5, z: -2.8 },
  topStrut: { width: 4.5, height: 0.2, depth: 0.3, y: 1.8, z: -2.5 },
  verticalStrut: { width: 0.15, height: 3.5, depth: 0.15, x: 2.3, z: -2.5 },

  // Darkening side/top walls to feel like looking out a window
  wall: { width: 2.5, height: 5, x: 3.6, z: -2.2, opacity: 0.2 },
  topWall: { width: 5, height: 2, y: 2.5, z: -2.2 },

  // External debug ship (currently hidden, kept for future external view)
  external: {
    body: { radius: 2.8, height: 11, rotX: Math.PI / 2 },
    wing: { w: 7, h: 0.6, d: 2.2, x: 4.5 },
    glow: { r: 1.6, z: 3, opacity: 0.6 },
  },
}

// =============================================================================
// CAMERA / VIEW (first-person Elite style)
// =============================================================================
export const VIEW = {
  fov: 68,
  near: 0.5,
  far: 4000,
  initialPos: { x: 0, y: 40, z: 140 },
  cockpitBack: 5.5,   // how far behind the nose the eye is
  eyeHeight: 1.8,
  lookFar: 300,
}

// =============================================================================
// 3D HOLO RADAR (lower center, classic circular scanner attached to camera)
// =============================================================================
export const RADAR_3D = {
  position: { x: 0, y: -1.0, z: -4.2 },  // moved up 25% of radar height (outer ry=1.6 → height~3.2, 25%=0.8; -1.8 + 0.8 = -1.0) to overlap lower windscreen as requested
  outer: { rx: 2.4, ry: 1.6, segments: 48 },
  innerRadii: [0.8, 1.6],
  spokes: 4,
  blip: { r: 0.09, segments: 6, count: 10 }, // pre-allocated pool

  // Projection tuning (classic feel: forward is "up" on the ellipse)
  projX: 0.012,
  projY: 0.005,   // elevation component
  projZ: 0.008,   // depth component

  // Sizing / range
  maxRangeShip: 300,
  maxRangeBody: 500,
  sizeNear: 0.15,
  sizeFar: 0.05,
  sizeDistDiv: 300,
  shipYScale: 0.6,   // slightly elongated squares
  bodyScale: 1.3,
  mindSizeMul: 2.5,
  mindYScale: 0.42,
}

/** Capital Mind (GSV) radar glyph — Culture-style contact on both scanners. */
export const MIND_RADAR = {
  /** Minds are visible far beyond normal ship radar (hull is huge; centre is distant). */
  maxRange: 2500,
  colors: {
    hull2d: '#7a6e58',
    ring2d: '#c8b878',
    core2d: '#66aaff',
    blip3d: 0xc8b878,
    core3d: 0x66aaff,
  },
  sizeMul2d: 2.5,
  labelDist: 1200,
}

// =============================================================================
// 2D ANGLED SCANNER (bottom dashboard, side-on ~20deg "nearby things")
// =============================================================================
export const SCANNER_2D = {
  // Canvas is sized by the JSX; these are the draw tunables
  pitchDeg: 24,
  baseYFactor: 0.76,
  depthFactor: 0.52,
  elevFactor: 1.1,
  latFactor: 3.12,
  // Grid / volume
  numRangeLines: 5,
  maxZ: 155,
  sideWallZ: 310,
  halfWidthBase: 272,
  taper: 0.52,
  brightPlaneHalfW: 296,
  // Glyph sizing
  sizeNear: 23.2,
  sizeFar: 8.8,
  sizeDistDiv: 165,
  // Filters + labels
  maxRangeShip: 300,
  maxRangeBody: 500,
  labelDist: 125,
  // Player marker
  chevron: { back: 10, side: 8, fwd: 6 },
  // Radar UI element colors
  gridColor: 'rgba(102,170,255,0.4)',
  brightColor: '#66aaff',
  labelColor: '#66aaff',
  playerColor: '#aaddff',
  elevationStickColor: '#88aaff',
  nearbyLabelColor: '#66aaff',
}

// =============================================================================
// FUEL / STATUS (left-side vertical holo bars attached to camera)
// =============================================================================
export const FUEL = {
  max: 120,
  /** Hyperspace jump cost = base + distance × rate (rounded). Tuned so ~30 AU hops fit one tank. */
  jump: {
    sameSystemBase: 4,
    sameSystemPerAu: 2.5,
    interSystemBase: 8,
    interSystemPerLy: 6,
  },
  barCount: 10,
  bar: { w: 0.12, h: 0.18, d: 0.04, spacing: 0.28 },
  groupPos: { x: 3.8, y: -1.2, z: -4.5 },
}

// =============================================================================
// RETICLE (center targeting computer)
// =============================================================================
export const RETICLE = {
  position: { x: 0, y: 0, z: -4.5 },
  h: 1.2,
  v: 0.9,
  circleR: 0.55,
  segments: 24,
}

// =============================================================================
// VECH SHIP HOLO ICON (3D GLB inside ring, right of lower radar)
// =============================================================================
export const VECH = {
  groupPos: { x: 2.6, y: -0.9, z: -2.55 },
  ring: { r: 1.55, ry: 1.0, segments: 24 },

  // Auto-scale target after centering the loaded GLB
  targetSize: 1.15,

  // Nice angled pop for a hovercraft silhouette
  modelRot: { x: -1.35, y: 0.15, z: 0.05 },
  modelZ: 0.28,

  // Holo material overrides
  emissive: 0x4488ff,
  emissiveIntensity: 0.85,
  opacity: 0.92,

  // Extra light so PBR-ish GLB is visible in the dark cockpit
  light: { color: 0x88aaff, intensity: 4, distance: 10, pos: { x: 0, y: 0, z: 1.6 } },

  // model-viewer preview (separate panel)
  cameraOrbit: '0deg 70deg 15%',
  cameraTarget: '0 -0.15 0',
}

// =============================================================================
// HYPERSPACE (classic Elite tunnel + cartography jump)
// =============================================================================
export const HYPERSPACE = {
  countdown: 3,
  streakCount: 90,
  streakLenMin: 24,
  streakLenVar: 48,
  streakWidth: 0.14,
  streakRadiusMin: 0.5,
  streakRadiusVar: 38,
  streakYScale: 0.75,
  streakColor: 0xbbeeff,
  spawnZMin: -120,
  spawnZVar: 70,
  passZ: 14,
  speedBase: 55,
  duration: 2.6,
  movePhaseFactor: 1.6,
}

// =============================================================================
// STARFIELD + WORLD
// =============================================================================
export const WORLD = {
  starCount: 4200,
  starRadiusMin: 650,
  starRadiusVar: 1100,
  starSize: 2.8,
  sunRadius: 9,
  sunColor: 0xffe6a3,

  hemi: { sky: 0x334466, ground: 0x000011, intensity: 0.6 },

  bodyOrbitRingOpacity: 0.2,
  stationPulseSpeed: 3,
  stationPulseAmp: 0.08,
}

// =============================================================================
// SPACE STATION MESH (procedural ring habitat)
// =============================================================================
// =============================================================================
// LAYERED SPACE (system map units ↔ local flight meters)
// =============================================================================
export const SPACE = {
  /** Local flight meters per cartography map unit (orbital plane). */
  localUnitsPerMapUnit: 12,
  /** Max distance to render bodies / contacts in local flight frame. */
  bubbleRadius: 2800,
  /** Standoff when arriving at a non-station body via hyperspace. */
  arrivalStandoff: 140,
} as const

export const DOCK = {
  range: 80,
  maxApproachSpeed: 8,
  approachDistance: 55,
  dockedDistance: 28,
  undockBackDistance: 40,
  cutsceneDuration: 1.4,
  undockBoost: 4,
}

/**
 * Live dock cutscene — filmed fly-in through the always-open bay, no door animation.
 * Trigger on approach → spline fly-in → force-field cross → market/interior handoff.
 */
export const DOCK_LIVE = {
  approachTrigger: 140,
  forceFieldCrossZ: -6,
  flyInDuration: 4.8,
  handoffToMarket: true,
} as const

// =============================================================================
// WINDSCREEN WAYPOINTS (off-bubble body direction tags)
// =============================================================================
export const WAYPOINTS = {
  edgeInset: 0.08,
  minLocalDist: 400,
  /** One hardcoded test star — set true to verify projection in isolation. */
  debugHardcoded: false,
  /** Scene-space offset from player (floating origin). Pure +X = off the right wing. */
  debugOffset: { x: 6000, y: 0, z: 2000 },
}

export const MARKET = {
  startingCredits: 12000,
  cargoCapacity: 20,
  /** One discrete market hour tick per this many sim seconds */
  hourIntervalSeconds: 10,
  maxChartPrice: 7000,
  ui: {
    title: 'BellToy Marketplace',
    cardBg: 'rgba(8, 12, 24, 0.88)',
    cardBorder: 'rgba(80, 100, 140, 0.35)',
    cardActiveBorder: 'rgba(102, 170, 255, 0.45)',
    price: '#e8d070',
    surplus: '#6dffb2',
    scarcity: '#ff8866',
    demand: '#e8b050',
    stock: '#6eb8ff',
    chartUp: '#5ddf8a',
    chartDown: '#ff7a6a',
    chartBg: 'rgba(0, 4, 10, 0.75)',
  },
}

export const STATION = {
  scaleFromRadius: 1.35,
  ringMajor: 1.55,
  ringMinor: 0.14,
  armLength: 1.05,
  solarW: 0.75,
  solarH: 0.42,
  hullOpacity: 0.82,
  panelColor: 0x446688,
  panelOpacity: 0.35,
  ringSpin: 0.12,
  beaconPulse: 2.8,
  beaconA: 0x66ffaa,
  beaconB: 0xff6688,
}

// =============================================================================
// BIG CAPITAL FREIGHTER (dark hull + Flocker city-light windows)
// =============================================================================

/** Hull nameplate font presets — swap `BIG_SHIP.nameLabel.font` to try another. */
export const HULL_LABEL_FONTS = {
  /** Bold condensed — default freighter stencil feel. */
  industrial: 'Impact, "Arial Narrow", "Helvetica Neue Condensed Bold", sans-serif',
  /** Military stencil cut-out. */
  stencil: 'Stencil, "Arial Black", Impact, sans-serif',
  /** Matches holo UI / ship systems readout. */
  mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
  /** Heavy extended capitals. */
  wide: '"Arial Black", "Helvetica Neue", system-ui, sans-serif',
  /** Clean sans (previous default). */
  classic: '"Segoe UI", system-ui, sans-serif',
} as const

export const BIG_SHIP = {
  /** Hull + window layout multiplier (base mesh units × scale). */
  scale: 10,
  hullColor: 0x05070d,
  detailHullColor: 0x080a12,
  pressureDotY: 14 * 10,
  nameLabel: {
    text: 'BOREAL',
    color: '#5a6b78',
    opacity: 0.74,
    /** One of HULL_LABEL_FONTS keys: industrial | stencil | mono | wide | classic */
    font: 'industrial' as keyof typeof HULL_LABEL_FONTS,
    /** Extra spacing between letters (× font size). */
    letterSpacing: 0.14,
    planeWidthMul: 0.98,
    planeHeightMul: 0.66,
  },
  window: {
    /** Pane size on the scaled hull (smaller = more lights that still fit without overlap). */
    paneSizeMul: 0.4,
    w: 0.62 * 10 * 0.4,
    h: 0.82 * 10 * 0.4,
    /** Min centre-to-centre spacing as a multiple of pane size. */
    gap: 2.35,
    activity: 0.035,
    flickerHz: 0.014,
    /** Share of panes with fixed lit/dim; only the rest slowly toggle. */
    stableFraction: 0.96,
    litColor: 0xfff0c2,
    dimColor: { r: 0.05, g: 0.06, b: 0.09 },
  },
} as const

/** Standalone BOREAL dock bay — always-open entrance below the hull nameplate. */
export const BOREAL_DOCK_BAY = {
  widthMul: 0.3,
  heightMul: 0.11,
  surfaceOffset: 0.22,
  gapBelowLabel: 0.45,
  lipDepth: 0.07,
  lipThickness: 0.06,
  voidColor: 0x000000,
  lipColor: 0x06080c,
  forceFieldColor: 0x0c1a32,
  forceFieldOpacity: 0.34,
  guideLightLit: 0xffffff,
  guideLightWarm: 0xffe8a8,
  guideLightDim: 0x1a1e24,
  guideLightW: 0.05,
  guideLightsPerEdge: 18,
  approachGuideW: 0.042,
  approachGuideCount: 5,
  approachGuideRunwayMul: 0.44,
  /** Airstrip chase — head travels 0→1; trail = affected fraction behind head. */
  airstripFlashHz: 1.0,
  airstripTrail: 0.32,
  /** Perpendicular approach rails: same wave, inverted (always on, brief dip). */
  approachFlashHz: 0.72,
  approachChaseDelay: 0.12,
} as const

// =============================================================================
// NPC MESHES (in-world 3D cones + pressure dots)
// =============================================================================
export const NPC = {
  size: { freighter: 95, pirate: 2.6, police: 2.1, default: 1.7 },
  cone: (size: number) => ({ r: size * 0.55, h: size * 2.4 }),
  color: {
    freighter: 0x334455,
    pirate: 0xff6b6b,
    police: 0x6bffa3,
    escort: 0x88ddff,
    trader: 0xaabbcc,
  },
  dot: { r: 0.9, yOffset: 1.8, opacity: 0.85 },
  pressureThreshold: 0.55,
  lookAhead: 5,
}

// =============================================================================
// 2D HOLO MAP (draggable cartography panel)
// =============================================================================
// COCKPIT WINDSCREEN (cartography holo projects here, not full viewport)
// =============================================================================
export const WINDSCREEN = {
  top: 45,
  left: 85,
  right: 85,
  bottom: 210,
  border: 'rgba(102, 170, 255, 0.28)',
  innerGlow: 'inset 0 0 48px rgba(102, 170, 255, 0.14), inset 0 0 12px rgba(0, 170, 255, 0.08)',
}

/** Aspect ratio of the windscreen cutout (not the full browser viewport). */
export function windscreenAspect(windowW: number, windowH: number): number {
  const w = windowW - WINDSCREEN.left - WINDSCREEN.right
  const h = windowH - WINDSCREEN.top - WINDSCREEN.bottom
  return w / Math.max(h, 1)
}

/** Cockpit overlay stacking — holo effects full-screen but under translucent ship UI. */
export const Z = {
  scene: 0,
  hyperspace: 5,        // full-viewport translucent tunnel — above 3D, below all cockpit UI
  dashboard: 10,
  cartography: 15,
  market: 15,
  cockpitWidgets: 17,   // radar, Vech, hyperspace panel
  logo: 18,
  bezel: 20,            // windscreen frame — always over holo effects
} as const

/** Bottom cockpit dashboard chrome (scanner, Vech preview, left column). */
export const DASHBOARD = {
  height: 210,
  leftColumn: {
    left: 'calc(50% - 614px)',
    width: 240,
    bottom: 60,
  },
  /** Shared chrome for left destination / hyperspace info card */
  leftPanel: {
    background: 'rgba(0, 6, 14, 0.8)',
    border: '1px solid rgba(0, 170, 255, 0.1)',
    borderRadius: 2,
    padding: '24px 18px',
  },
  radar: {
    bottom: 60,
    width: 712,
    height: 200,
  },
} as const

export const MAP = {
  // Legacy reference scale (340px panel era)
  canvasSize: 340,
  scale: 0.48,
  gridStep: 65,
  orbitOpacity: 0.22,
  bodyLabelFont: '10px ui-monospace, monospace',
  // Fullscreen windscreen overlay (Flocker palette)
  windscreenBg: '#050e15',
  orbitStroke: 'rgba(169, 199, 216, 0.22)',
  routeColor: '#d9f2ff',
  highlightOrigin: '#ffcc66',
  highlightDest: '#66aaff',
  playerColor: '#ffdd88',
  ui: {
    text: '#d8eeff',
    muted: 'rgba(170, 204, 221, 0.7)',
    panelBg: 'rgba(4, 12, 22, 0.92)',
    panelBorder: 'rgba(102, 170, 255, 0.22)',
    listBg: 'rgba(4, 12, 22, 0.94)',
    listBorder: 'rgba(102, 170, 255, 0.18)',
    rowBg: 'rgba(4, 16, 32, 0.45)',
    rowBorder: 'rgba(102, 170, 255, 0.12)',
    activeBg: 'rgba(102, 170, 255, 0.2)',
    activeColor: '#ffffff',
    font: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  },
}

// =============================================================================
// DRAGGABLE HOLO PANELS (Minority Report style)
// =============================================================================
export const PANELS = {
  width: 360,
  mapInitial: { x: 820, y: 60 },
  controlsInitial: { x: 820, y: 430 },
  dragBounds: {
    minX: 10,
    maxXPad: 480,
    minY: 10,
    maxYPadMap: 420,
    maxYPadControls: 200,
  },
  z: 25,
  headerGradient: 'linear-gradient(to right, rgba(0,120,200,0.25), rgba(0,80,150,0.1))',
  headerBorder: '#0099dd',
}

// Small helpers kept with config for convenience
export function roleColor(role: string) {
  if (role === 'freighter') return NPC.color.freighter
  if (role === 'pirate') return COLORS.pirate
  if (role === 'police' || role === 'escort') return COLORS.police
  return COLORS.trader
}

export function roleCss(role: string) {
  if (role === 'freighter') return '#e8c878'
  if (role === 'pirate') return COLORS.pirateCss
  if (role === 'police' || role === 'escort') return COLORS.escortCss
  return COLORS.neutralCss
}

export type NpcAgentRole = 'trader' | 'pirate' | 'police' | 'escort' | 'freighter'

// (Re-export for convenience in render/ui that only need role strings)
export type { NpcAgentRole as Role }

export function npcSizeForRole(role: NpcAgentRole) {
  if (role === 'freighter') return NPC.size.freighter
  if (role === 'pirate') return NPC.size.pirate
  if (role === 'police') return NPC.size.police
  return NPC.size.default
}
