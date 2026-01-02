import { useEffect, useRef } from 'react'
import { OrgType, OrgInstance } from '../types'

const ICON_SIZE = 64  // visual size
const DRAW_SCALE = 2.5 // how “zoomed” the org appears

const Icon: React.FC<{ type: OrgType; color: string }> = ({ type, color }) => {
    const ref = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = ref.current
        if (!canvas) return

        // 1. Set drawing buffer size
        canvas.width = ICON_SIZE
        canvas.height = ICON_SIZE

        const ctx = canvas.getContext("2d")!
        ctx.clearRect(0, 0, ICON_SIZE, ICON_SIZE)

        // 2. Move origin to centre
        ctx.translate(ICON_SIZE / 2, ICON_SIZE / 2)

        // 3. Scale drawing
        ctx.scale(DRAW_SCALE, DRAW_SCALE)

        const dummyOrg: OrgInstance = {
            pos: { x: 0, y: 0 },
            vel: { x: 1, y: 0 }, // stable heading
            type,
            color
        }

        type.draw(ctx, dummyOrg)
    }, [type])
    return (
        <canvas
            ref={ref}
            width={ICON_SIZE}
            height={ICON_SIZE}
            style={{ width: ICON_SIZE, height: ICON_SIZE }}
        />
    )
}

export default Icon