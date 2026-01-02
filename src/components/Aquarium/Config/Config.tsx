import Card from '../Card'
import Slider from "../Slider"
import { ConfigType } from "../types"

type Props = {
    env: ConfigType
    setEnv: (e: ConfigType) => void
}

const Config: React.FC<Props> = ({ env, setEnv }) => {
    
    const update = (k: keyof ConfigType, v: number) => setEnv({ ...env, [k]: v })

    return (
        <Card style={{ right: 20, top: 20, width: 260, position: 'absolute' }}>
            <strong>Settings</strong>
            <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
                <Slider label="cohesion (k0)" min={0} max={2} step={0.01} value={env.k0} onChange={(v: number) => update("k0", v)} toFixed={2} />
                {/* <Slider label="Alignment" min={0} max={2.5} step={0.01} value={env.align} onChange={v => update("align", v)} />
                <Slider label="Align Saturation" min={1} max={20} step={1} value={env.alignSaturation} onChange={v => update("alignSaturation", v)} />
                <Slider label="Align Noise" min={0} max={0.08} step={0.001} value={env.alignNoise} onChange={v => update("alignNoise", v)} /> */}
                <Slider label="drag" min={0.97} max={0.999} step={0.0005} value={env.drag} onChange={(v: number) => update("drag", v)} />
                <Slider label="acceleration" min={0.01} max={0.06} step={0.001} value={env.accelScale} onChange={(v: number) => update("accelScale", v)} />
                <Slider label="opacity" min={0} max={1} step={0.01} value={env.canvasOpacity} onChange={(v: number) => update("canvasOpacity", v)} toFixed={2} />
                <Slider label="predator strength" min={0.05} max={0.5} step={0.01} value={env.predatorStrength} onChange={(v: number) => update("predatorStrength", v)} toFixed={2} />
                <Slider label="predator radius" min={40} max={300} step={5} value={env.predatorRadius} onChange={(v: number) => update("predatorRadius", v)}  toFixed={0} />
                {/* <Slider label="Wall Strength" min={0.001} max={0.05} step={0.001} value={env.wallStrength} onChange={v => update("wallStrength", v)} />
                <Slider label="Wall Margin" min={10} max={80} step={1} value={env.wallMargin} onChange={v => update("wallMargin", v)} /> */}
            </div>
        </Card>
    )
}

export default Config