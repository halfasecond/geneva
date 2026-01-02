import { OrgInstance } from "./types"

export const draw = (
    ctx: CanvasRenderingContext2D,
    f: OrgInstance,
    drawType: string
) => {
    if (drawType === "ellipse") {
        ctx.save()
        ctx.translate(f.pos.x, f.pos.y)
        ctx.scale(f.type.size / 2, f.type.size / 2) // ← restore coupling

        ctx.fillStyle = f.color
        ctx.beginPath()
        ctx.ellipse(0, 0, 3.5, 2.2, 0, 0, Math.PI * 2)
        ctx.fill()

        ctx.restore()
    }

    if (drawType === "drifter") {
        ctx.save()
        ctx.translate(f.pos.x, f.pos.y)
        ctx.scale(f.type.size, f.type.size) // ← restore coupling

        ctx.fillStyle = f.color
        ctx.globalAlpha = 0.9
        ctx.beginPath()
        ctx.arc(0, 0, 1.2, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
    }

    if (drawType === "torpedo") {
        const heading = Math.atan2(f.vel.y, f.vel.x)
        ctx.save()
        ctx.translate(f.pos.x, f.pos.y)
        ctx.rotate(heading)
        const scale = f.type.size
        ctx.scale(scale, scale)

        ctx.strokeStyle = f.color
        ctx.lineWidth = 0.2 * scale
        ctx.globalAlpha = 1

        ctx.beginPath()
        ctx.moveTo(9, 0)
        ctx.lineTo(-5, -4)
        ctx.lineTo(-5, 4)
        ctx.closePath()
        ctx.stroke()

        ctx.restore()
    }
}
