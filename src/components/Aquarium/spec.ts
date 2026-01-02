import { OrgType, OrgShape, StatSpec, ConfigType, OrgInstance, CensusEntry, ShapeId } from './types'
import { draw } from './draw'

export const DEFAULT_ENV: ConfigType = {
    k0: 0.05,
    align: 1.2,
    alignSaturation: 6,
    alignNoise: 0.015,
    drag: 0.995,
    accelScale: 0.028,
    wallStrength: 0.015,
    wallMargin: 28,
    predatorStrength: 0.5,
    predatorRadius: 200,
    canvasOpacity: .35
}

export const ORG_SHAPES: OrgShape[] = [
    {
        id: "ellipse",
        label: "Bulky",
        draw: (ctx, f) => draw(ctx, f, "ellipse")
    },
    {
        id: "drifter",
        label: "Drifter",
        draw: (ctx, f) => draw(ctx, f, "drifter")
    },
    {
        id: "torpedo",
        label: "Torpedo",
        draw: (ctx, f) => draw(ctx, f, "torpedo")
    }
]

export const ORG_STAT_SPECS: Record<
    keyof Pick<
        OrgType,
        | "size"
        | "mass"
        | "maxSpeed"
        | "alignmentStrength"
        | "alignmentRadius"
        | "cohesionStrength"
        | "cohesionRadius"
        | "separationStrength"
        | "separationRadius"
    >,
    StatSpec
> = {
    size: { min: 0.3, max: 1, step: 0.01 },
    mass: { min: 0.2, max: 6.0, step: 0.05 },
    maxSpeed: { min: 0.8, max: 6.0, step: 0.05 },
    alignmentStrength: { min: 0, max: 3, step: 0.01 },
    alignmentRadius: { min: 5, max: 200, step: 1 },
    separationStrength: { min: 0, max: 3, step: 0.01 },
    separationRadius: { min: 2, max: 80, step: 1 },
    cohesionStrength: { min: 0, max: 1, step: 0.01 },
    cohesionRadius: { min: 50, max: 300, step: 1 }
}

const randomInSpec = (spec: { min: number; max: number }) => Math.round((spec.min + Math.random() * (spec.max - spec.min)) * 10) / 10

export const generateRandomOrgType = (species: OrgShape): OrgType => (
    {   
        species: species.id,
        size: randomInSpec(ORG_STAT_SPECS.size),
        mass: randomInSpec(ORG_STAT_SPECS.mass),
        maxSpeed: randomInSpec(ORG_STAT_SPECS.maxSpeed),
        alignmentStrength: randomInSpec(ORG_STAT_SPECS.alignmentStrength),
        cohesionStrength: randomInSpec(ORG_STAT_SPECS.cohesionStrength),
        separationStrength: randomInSpec(ORG_STAT_SPECS.separationStrength),
        alignmentRadius: randomInSpec(ORG_STAT_SPECS.alignmentRadius),
        cohesionRadius: randomInSpec(ORG_STAT_SPECS.cohesionRadius),
        separationRadius: randomInSpec(ORG_STAT_SPECS.separationRadius),
        draw: species.draw
    }
)

export const generateOrgType = (species: any, spec: any): OrgType => (
    {   
        species: spec.species,
        size: spec.size,
        mass: spec.mass,
        maxSpeed: spec.maxSpeed,
        alignmentStrength: spec.alignmentStrength,
        cohesionStrength: spec.cohesionStrength,
        separationStrength: spec.separationStrength,
        alignmentRadius: spec.alignmentRadius,
        cohesionRadius: spec.cohesionRadius,
        separationRadius: spec.separationRadius,
        draw: species.draw
    }
)

export const buildCensus = (orgs: OrgInstance[]): CensusEntry[] => {
    const map = new Map<string, CensusEntry>()
    for (const o of orgs) {
        const key = `${o.type.size}:${o.type.mass}`
        if (!map.has(key)) {
            map.set(key, {
                type: o.type,
                count: 0,
                color: o.color
            })
        }
        map.get(key)!.count++
    }
    return Array.from(map.values())
}