// Ported and adapted from Flocker client cartography module.
// Provides live orbiting bodies (star, planets, moons, stations) with elliptical orbits.
// Used for both the in-flight decorative bodies and the overlay map + hyperspace targets.

export interface CartographyBody {
  id: string
  name: string
  type: 'star' | 'planet' | 'moon' | 'station'
  color: string
  radius: number
  orbitRadius: number
  parentId?: string
  pos2d: { x: number; y: number }
  pos3d: { x: number; y: number; z: number } // for main 3D world (y up)
}

const bodyPresets = [
  { id: 'helios', name: 'Helios', type: 'star' as const, color: '#ffe6a3', radius: 13, orbitRadius: 0, orbitSpeed: 0, angle: 0, eccentricity: 0 },
  { id: 'aster', name: 'Aster Prime', type: 'planet' as const, color: '#62d6ff', radius: 6, orbitRadius: 145, orbitSpeed: 0.018, angle: 0.35, eccentricity: 0.04, parentId: 'helios' },
  { id: 'aster-moon', name: 'Lark', type: 'moon' as const, color: '#ccd5dd', radius: 2.7, orbitRadius: 25, orbitSpeed: 0.082, angle: 1.2, eccentricity: 0.08, parentId: 'aster' },
  { id: 'aster-hub', name: 'Aster Hub', type: 'station' as const, color: '#9be7c1', radius: 2.2, orbitRadius: 36, orbitSpeed: 0.052, angle: 3.75, eccentricity: 0.02, parentId: 'aster' },
  { id: 'cinder', name: 'Cinder', type: 'planet' as const, color: '#ff9f72', radius: 5.2, orbitRadius: 225, orbitSpeed: 0.011, angle: 2.2, eccentricity: 0.08, parentId: 'helios' },
  { id: 'cinder-exchange', name: 'Cinder Exchange', type: 'station' as const, color: '#d8fff0', radius: 2.4, orbitRadius: 34, orbitSpeed: 0.046, angle: 5.1, eccentricity: 0.05, parentId: 'cinder' },
  { id: 'helio-port', name: 'Helio Port', type: 'station' as const, color: '#fff3c4', radius: 2.5, orbitRadius: 94, orbitSpeed: 0.026, angle: 0.18, eccentricity: 0.12, parentId: 'helios' },
  { id: 'boreal', name: 'Boreal', type: 'planet' as const, color: '#6ce6ff', radius: 8, orbitRadius: 320, orbitSpeed: 0.0075, angle: 4.45, eccentricity: 0.06, parentId: 'helios' },
  { id: 'boreal-moon', name: 'Vela', type: 'moon' as const, color: '#cdd7ff', radius: 3, orbitRadius: 38, orbitSpeed: 0.064, angle: 0.9, eccentricity: 0.1, parentId: 'boreal' },
  { id: 'mira-depot', name: 'Mira Depot', type: 'station' as const, color: '#e6e8ff', radius: 2.3, orbitRadius: 47, orbitSpeed: 0.048, angle: 2.8, eccentricity: 0.07, parentId: 'boreal' },
  { id: 'boreal-station', name: 'Boreal Station', type: 'station' as const, color: '#d7fff1', radius: 2.3, orbitRadius: 55, orbitSpeed: 0.041, angle: 5.6, eccentricity: 0.03, parentId: 'boreal' },
]

export const CARTOGRAPHY_BODIES = bodyPresets

export function getCartographyBodies(elapsedSeconds: number): CartographyBody[] {
  const positioned = new Map<string, { x: number; y: number }>()
  const result: CartographyBody[] = []

  for (const preset of bodyPresets) {
    const parentPos = preset.parentId ? positioned.get(preset.parentId) : { x: 0, y: 0 }
    const angle = preset.angle + elapsedSeconds * preset.orbitSpeed
    const ecc = preset.eccentricity ?? 0
    const xR = preset.orbitRadius
    const yR = preset.orbitRadius * (1 - ecc)

    const relX = Math.cos(angle) * xR
    const relY = Math.sin(angle) * yR

    const x = preset.type === 'star' ? 0 : (parentPos?.x ?? 0) + relX
    const y = preset.type === 'star' ? 0 : (parentPos?.y ?? 0) + relY

    positioned.set(preset.id, { x, y })

    // For 3D world: map 2D (x,y) -> (x, smallHeight, y) so y becomes depth, add slight vertical for visual
    const height = preset.type === 'star' ? 0 : (preset.type === 'station' ? 18 : preset.type === 'moon' ? 8 : 0) + Math.sin(angle * 1.7) * 4
    const pos3d = { x, y: height, z: y * 0.65 } // squash a bit for nice 3D spread

    result.push({
      id: preset.id,
      name: preset.name,
      type: preset.type,
      color: preset.color,
      radius: preset.radius,
      orbitRadius: preset.orbitRadius,
      parentId: preset.parentId,
      pos2d: { x, y },
      pos3d,
    })
  }

  return result
}

export function getBodyById(id: string, elapsedSeconds: number) {
  return getCartographyBodies(elapsedSeconds).find(b => b.id === id)
}

export function getDistance2D(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

export const DEFAULT_ROUTE = {
  originId: 'aster-hub',
  destinationId: 'boreal-station',
}

// Simple fuel cost: base + proportional to 2D distance
export function getJumpFuelCost(from: { x: number; y: number }, to: { x: number; y: number }, base = 12) {
  const dist = getDistance2D(from, to)
  return Math.round(base + dist * 0.09)
}
