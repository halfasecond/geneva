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
  streakCount: 70,
  streakLenMin: 22,
  streakLenVar: 38,
  streakRadiusMin: 5,
  streakRadiusVar: 26,
  baseZ: -55,
  baseZVar: 80,
  speedBase: 220,
  speedVar: 110,
  duration: 2.3,           // seconds for the phase
  movePhaseFactor: 0.8,
  fadeStart: 0.9,
  respawnBehind: -35,
  respawnZ: -70,
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
// NPC MESHES (in-world 3D cones + pressure dots)
// =============================================================================
export const NPC = {
  size: { pirate: 2.6, police: 2.1, default: 1.7 },
  cone: (size: number) => ({ r: size * 0.55, h: size * 2.4 }),
  color: {
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
export const MAP = {
  // Legacy reference scale (340px panel era)
  canvasSize: 340,
  scale: 0.48,
  gridStep: 65,
  orbitOpacity: 0.22,
  bodyLabelFont: '10px ui-monospace, monospace',
  // Fullscreen windscreen overlay (Flocker palette)
  fullscreenBg: '#050e15',
  orbitStroke: 'rgba(169, 199, 216, 0.22)',
  routeColor: '#d9f2ff',
  highlightOrigin: '#ffcc66',
  highlightDest: '#32d296',
  playerColor: '#ffdd88',
  ui: {
    text: '#f7fff9',
    muted: 'rgba(225, 237, 231, 0.66)',
    panelBg: 'rgba(5, 14, 21, 0.42)',
    panelBorder: 'rgba(229, 236, 224, 0.1)',
    listBg: 'rgba(5, 14, 21, 0.36)',
    listBorder: 'rgba(229, 236, 224, 0.09)',
    rowBg: 'rgba(22, 39, 56, 0.42)',
    rowBorder: 'rgba(229, 236, 224, 0.08)',
    activeBg: 'rgba(50, 210, 150, 0.14)',
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
  if (role === 'pirate') return COLORS.pirate
  if (role === 'police' || role === 'escort') return COLORS.police
  return COLORS.trader
}

export function roleCss(role: string) {
  if (role === 'pirate') return COLORS.pirateCss
  if (role === 'police' || role === 'escort') return COLORS.escortCss
  return COLORS.neutralCss
}

export type NpcAgentRole = 'trader' | 'pirate' | 'police' | 'escort'

// (Re-export for convenience in render/ui that only need role strings)
export type { NpcAgentRole as Role }

export function npcSizeForRole(role: NpcAgentRole) {
  if (role === 'pirate') return NPC.size.pirate
  if (role === 'police') return NPC.size.police
  return NPC.size.default
}
