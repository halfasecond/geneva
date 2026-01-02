import { OrgInstance, OrgContext, ConfigType } from "./types"

export function update(
    species: OrgInstance,
    ctx: OrgContext,
    env: ConfigType
) {
    let ax = 0
    let ay = 0

    let alignX = 0
    let alignY = 0
    let neighbors = 0

    /* --------------------------------
       Local neighbourhood forces
    --------------------------------- */
    for (const other of ctx.allOrg) {
        if (other === species) continue

        const dx = other.pos.x - species.pos.x
        const dy = other.pos.y - species.pos.y
        const r = Math.hypot(dx, dy) || 0.0001

        // Separation
        if (r < species.type.separationRadius) {
            ax -= (dx / r) * species.type.separationStrength
            ay -= (dy / r) * species.type.separationStrength
        }

        // Cohesion
        if (r < species.type.cohesionRadius) {
            const force = Math.exp(env.k0 * r * 0.018) / r
            ax += (dx / r) * force * species.type.cohesionStrength
            ay += (dy / r) * force * species.type.cohesionStrength
        }

        // Alignment sampling
        if (r < species.type.alignmentRadius) {
            alignX += other.vel.x
            alignY += other.vel.y
            neighbors++
        }
    }

    /* --------------------------------
       Alignment with saturation
    --------------------------------- */
    if (neighbors > 0) {
        const mag = Math.hypot(alignX, alignY)
        if (mag > 0) {
            const sat =
                Math.min(neighbors, env.alignSaturation) / env.alignSaturation

            ax +=
                (alignX / mag) *
                species.type.alignmentStrength *
                env.align *
                sat

            ay +=
                (alignY / mag) *
                species.type.alignmentStrength *
                env.align *
                sat
        }
    }

    /* --------------------------------
       Predator avoidance
    --------------------------------- */
    if (ctx.predator) {
        const dx = species.pos.x - ctx.predator.x
        const dy = species.pos.y - ctx.predator.y
        const r = Math.hypot(dx, dy) || 0.0001

        if (r < env.predatorRadius) {
            const strength = (env.predatorRadius - r) * env.predatorStrength
            ax += (dx / r) * strength
            ay += (dy / r) * strength
        }
    }

    /* --------------------------------
       Soft tank walls
    --------------------------------- */
    const m = env.wallMargin
    const w = env.wallStrength

    if (species.pos.x > ctx.bounds.x - m) {
        const d = species.pos.x - (ctx.bounds.x - m)
        ax -= d * d * w
    }
    if (species.pos.x < -ctx.bounds.x + m) {
        const d = (-ctx.bounds.x + m) - species.pos.x
        ax += d * d * w
    }
    if (species.pos.y > ctx.bounds.y - m) {
        const d = species.pos.y - (ctx.bounds.y - m)
        ay -= d * d * w
    }
    if (species.pos.y < -ctx.bounds.y + m) {
        const d = (-ctx.bounds.y + m) - species.pos.y
        ay += d * d * w
    }

    /* --------------------------------
       Species-specific forces
    --------------------------------- */
    if (species.type.extraForce) {
        const extra = species.type.extraForce(species, ctx)
        ax += extra.x
        ay += extra.y
    }

    /* --------------------------------
       Integrate velocity (mass-aware)
    --------------------------------- */
    species.vel.x += (ax * env.accelScale) / species.type.mass
    species.vel.y += (ay * env.accelScale) / species.type.mass

    /* --------------------------------
       Angular noise (rotational agitation)
    --------------------------------- */
    if (env.alignNoise > 0) {
        const speed = Math.hypot(species.vel.x, species.vel.y)
        if (speed > 0.0001) {
            const angle = Math.atan2(species.vel.y, species.vel.x)
            const jitter =
                (Math.random() - 0.5) * env.alignNoise
            species.vel.x = Math.cos(angle + jitter) * speed
            species.vel.y = Math.sin(angle + jitter) * speed
        }
    }

    /* --------------------------------
       Water drag
    --------------------------------- */
    species.vel.x *= env.drag
    species.vel.y *= env.drag

    /* --------------------------------
       Speed cap
    --------------------------------- */
    const speed = Math.hypot(species.vel.x, species.vel.y)
    if (speed > species.type.maxSpeed) {
        species.vel.x *= species.type.maxSpeed / speed
        species.vel.y *= species.type.maxSpeed / speed
    }

    /* --------------------------------
       Integrate position
    --------------------------------- */
    species.pos.x += species.vel.x
    species.pos.y += species.vel.y
}
