import React, { useState } from "react"
import Card from "../Card"
import Icon from "../Icon"
import Slider from "../Slider"
import { OrgType, OrgShape } from "../types"
import { ORG_SHAPES, generateRandomOrgType } from "../spec"
import * as Styled from './Spawn.style'

type Props = {
    onSpawn: (species: OrgType, count: number) => void
}

/* ----------------------------
   Component
----------------------------- */
const Spawn: React.FC<Props> = ({ onSpawn }) => {
    const [count, setCount] = useState(20)
    const [shape, setShape] = useState<OrgShape | null>(null)

    const spawn = () => {
        if (shape) {
            const species = generateRandomOrgType(shape)
            onSpawn(species, count)
        }
    }

    return (
        <Card>
            <Styled.Div>
                {ORG_SHAPES.map(s => (
                    <div
                        key={s.id}
                        onClick={() => setShape(s)}
                        style={{
                            border:
                                shape && s.id === shape.id
                                    ? "2px solid #3a8fff"
                                    : "2px solid #223",
                            opacity: shape && s.id === shape.id ? 1 : 0.6
                        }}
                    >
                        <Icon
                            type={{
                                ...({} as OrgType),
                                draw: s.draw
                            }}
                            color="#8ff"
                        />
                    </div>
                ))}
            </Styled.Div>
            <Slider 
                label={'Population'}
                min={1}
                max={100}
                step={1}
                value={count}
                onChange={(v: number) => setCount(v)}
                toFixed={0}
            />
            <Styled.Button onClick={spawn} disabled={!shape}>Spawn Species</Styled.Button>
        </Card>
    )
}

export default Spawn
