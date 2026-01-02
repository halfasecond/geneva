import { Schema, Connection, Model } from "mongoose"
export const CensusEntrySchema = new Schema(
    {
        species: {
            type: String,
            required: true
        },

        color: {
            type: String,
            required: true
        },

        count: {
            type: Number,
            required: true,
            min: 1
        },

        // stats
        size: Number,
        mass: Number,
        maxSpeed: Number,

        alignmentStrength: Number,
        alignmentRadius: Number,

        cohesionStrength: Number,
        cohesionRadius: Number,

        separationStrength: Number,
        separationRadius: Number
    },
    { _id: false }
)


export interface Aquarium {
    account: string

    // env
    k0: number
    align: number
    alignSaturation: number
    alignNoise: number
    drag: number
    accelScale: number
    wallStrength: number
    wallMargin: number
    predatorStrength: number
    predatorRadius: number
    canvasOpacity: number

    // species
    census: Array<{
        species: string
        color: string
        count: number
        size: number
        mass: number
        maxSpeed: number
        alignmentStrength: number
        alignmentRadius: number
        cohesionStrength: number
        cohesionRadius: number
        separationStrength: number
        separationRadius: number
    }>
}

const AquariumSchema = new Schema<Aquarium>(
    {
        account: {
            type: String,
            required: true,
            index: true
        },

        // env config
        k0: Number,
        align: Number,
        alignSaturation: Number,
        alignNoise: Number,
        drag: Number,
        accelScale: Number,
        wallStrength: Number,
        wallMargin: Number,
        predatorStrength: Number,
        predatorRadius: Number,
        canvasOpacity: Number,

        // species list
        census: {
            type: [CensusEntrySchema],
            default: []
        }
    },
    {
        timestamps: true
    }
)

export default (prefix: string, db: Connection): Model<Aquarium> => {
    const modelName = `${prefix}_aquariums`
    return db.model<Aquarium>(modelName, AquariumSchema)
}

