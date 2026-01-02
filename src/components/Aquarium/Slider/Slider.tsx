import * as Styled from './Slider.style'

const Slider = ({
    label,
    min,
    max,
    step,
    value,
    onChange,
    toFixed
}: any) => (
    <Styled.Label>
        <span>
            {label}: {toFixed || toFixed === 0 ? value.toFixed(toFixed) : value.toFixed?.(3) ?? value}
        </span>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={e => onChange(+e.target.value)}
        />
    </Styled.Label>
)

export default Slider