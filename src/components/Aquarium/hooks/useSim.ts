// useSim.ts
import { useRef, useEffect, useCallback } from "react"
import { OrgInstance, OrgType, ConfigType, CensusEntry } from "../types"
import { buildCensus } from "../spec"
import { update } from "../update"

type UseSimArgs = {
    env: ConfigType
    setCensus: (c: CensusEntry[]) => void
}

export const useSim = ({ env, setCensus }: UseSimArgs) => {
    /* ----------------------------
       Refs
    ----------------------------- */
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const orgRef = useRef<OrgInstance[]>([])
    const animRef = useRef<number>(0)
    const predatorRef = useRef<{ x: number; y: number; age: number } | null>(null)
    const predatorTimeoutRef = useRef<number | null>(null)
    const envRef = useRef<ConfigType>(env)

    useEffect(() => {
        envRef.current = env
    }, [env])

    /* ----------------------------
       Helpers
    ----------------------------- */
    const sameSpecies = (a: OrgType, b: OrgType) =>
        a.size === b.size && a.mass === b.mass

    const spawn = (type: OrgType, color: string) => {
        const a = Math.random() * Math.PI * 2
        const r = 10 + Math.random() * 40

        orgRef.current.push({
            pos: { x: r * Math.cos(a), y: r * Math.sin(a) },
            vel: {
                x: (Math.random() - 0.5) * 3,
                y: (Math.random() - 0.5) * 3
            },
            type,
            color
        })
    }

    /* ----------------------------
       Public API
    ----------------------------- */
    const spawnSpecies = useCallback(
        (species: OrgType, count: number, color?: string) => {
            const _color = color ? color : `hsl(${Math.random() * 360 + Math.random() * 40}, 80%, 65%)`
            for (let i = 0; i < count; i++) spawn(species, _color)
            setCensus(buildCensus(orgRef.current))
        },
        [setCensus]
    )

    const editSpecies = useCallback(
        (original: OrgType, updated: OrgType) => {
            for (const o of orgRef.current) {
                if (sameSpecies(o.type, original)) o.type = updated
            }
            setCensus(buildCensus(orgRef.current))
        },
        [setCensus]
    )

    const deleteSpecies = useCallback(
        (type: OrgType) => {
            orgRef.current = orgRef.current.filter(o => !sameSpecies(o.type, type))
            setCensus(buildCensus(orgRef.current))
        },
        [setCensus]
    )

    const setSpeciesPopulation = useCallback(
        (type: OrgType, baseColor: string, targetCount: number) => {
            const orgs = orgRef.current
            const current = orgs.filter(o => sameSpecies(o.type, type))
            const diff = targetCount - current.length

            if (diff > 0) {
                for (let i = 0; i < diff; i++) {
                    spawn(type, baseColor)
                }
            } else if (diff < 0) {
                let toRemove = -diff
                for (let i = orgs.length - 1; i >= 0 && toRemove > 0; i--) {
                    if (sameSpecies(orgs[i].type, type)) {
                        orgs.splice(i, 1)
                        toRemove--
                    }
                }
            }

            setCensus(buildCensus(orgRef.current))
        },
        [setCensus]
    )

    const clearAll = useCallback(() => {
        orgRef.current.length = 0
        setCensus([])
    }, [])


    /* ----------------------------
       Predator click handler 
    ----------------------------- */
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const onClick = (e: MouseEvent) => {
            predatorRef.current = { x: e.clientX, y: e.clientY, age: 0 }

            if (predatorTimeoutRef.current) {
                window.clearTimeout(predatorTimeoutRef.current)
            }

            predatorTimeoutRef.current = window.setTimeout(() => {
                predatorRef.current = null
                predatorTimeoutRef.current = null
            }, 4000)
        }

        canvas.addEventListener("click", onClick)
        return () => {
            canvas.removeEventListener("click", onClick)
            if (predatorTimeoutRef.current) {
                window.clearTimeout(predatorTimeoutRef.current)
                predatorTimeoutRef.current = null
            }
        }
    }, [])

    /* ----------------------------
       Simulation loop
    ----------------------------- */
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const resize = () => {
            canvas.width = canvas.clientWidth
            canvas.height = canvas.clientHeight
        }

        resize()
        window.addEventListener("resize", resize)

        const loop = () => {
            const orgs = orgRef.current
            const cx = canvas.width / 2
            const cy = canvas.height / 2
            const scale = Math.min(canvas.width, canvas.height) / 340

            ctx.fillStyle = `rgba(0,0,15,${envRef.current.canvasOpacity})`
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            // physics
            for (const o of orgs) {
                update(
                    o,
                    {
                        allOrg: orgs,
                        predator: predatorRef.current
                            ? {
                                x: (predatorRef.current.x - cx) / scale,
                                y: (predatorRef.current.y - cy) / scale
                            }
                            : null,
                        bounds: {
                            x: canvas.width / scale / 2,
                            y: canvas.height / scale / 2
                        }
                    },
                    envRef.current
                )
            }

            // draw
            ctx.save()
            ctx.translate(cx, cy)
            ctx.scale(scale, scale)

            for (const o of orgs) o.type.draw(ctx, o)

            // predator ripple  ✅ (also missing vs old Aquarium.tsx)
            if (predatorRef.current) {
                const age = predatorRef.current.age++
                const px = (predatorRef.current.x - cx) / scale
                const py = (predatorRef.current.y - cy) / scale

                ctx.strokeStyle = `rgba(255, ${120 - age * 3}, ${80 - age * 3}, ${1 - age / 40})`
                ctx.lineWidth = 4 + age * 0.8
                ctx.beginPath()
                ctx.arc(px, py, age * 3, 0, Math.PI * 2)
                ctx.stroke()
            }

            ctx.restore()

            animRef.current = requestAnimationFrame(loop)
        }

        loop()

        return () => {
            window.removeEventListener("resize", resize)
            cancelAnimationFrame(animRef.current)
        }
    }, [])

    return {
        canvasRef,
        spawnSpecies,
        editSpecies,
        deleteSpecies,
        setSpeciesPopulation,
        clearAll
    }
}
