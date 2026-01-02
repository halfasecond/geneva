export type Vec2 = { x: number; y: number }

export interface Predator {
    x: number
    y: number
}

export interface OrgInstance {
    pos: Vec2
    vel: Vec2
    type: OrgType
    color: string
}

export interface OrgContext {
    allOrg: OrgInstance[]
    predator: Predator | null
    bounds: {
        x: number   // half-width in world units
        y: number   // half-height in world units
    }
}

export interface OrgType {
    species: ShapeId
    size: number      // visual scale
    mass: number      // inertia multiplier
    // Movement
    maxSpeed: number
    alignmentStrength: number
    alignmentRadius: number
    separationRadius: number
    separationStrength: number
    cohesionRadius: number
    cohesionStrength: number
    // Optional behaviour hook
    extraForce?: (Org: OrgInstance, ctx: OrgContext) => Vec2
    // Rendering
    draw?: (ctx: CanvasRenderingContext2D, Org: OrgInstance) => void
}

export interface CensusEntry {
    type: OrgType
    count: number
    color: string
}

export type StatSpec = {
    min: number
    max: number
    step?: number
    label?: string
}

export type ConfigType = {
    // flocking
    k0: number
    align: number
    alignSaturation: number
    alignNoise: number
    // medium
    drag: number
    accelScale: number
    // walls
    wallStrength: number
    wallMargin: number
    // predator
    predatorStrength: number
    predatorRadius: number
    canvasOpacity: number
}

export type ShapeId = "ellipse" | "drifter" | "torpedo"

export type OrgShape = {
    id: ShapeId
    label: string
    draw: OrgType["draw"]
}
