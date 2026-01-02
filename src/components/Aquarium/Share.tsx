import React, { useEffect, useRef, useState } from "react"
import axios from 'axios'
import { useParams, Link } from 'react-router-dom';
import { ConfigType, CensusEntry } from "./types"
import { DEFAULT_ENV, generateOrgType, ORG_SHAPES } from "./spec"
import { useSim } from "./hooks/useSim"
import Logo from "./Logo"
import * as Styled from "./Aquarium.style"


/* ----------------------------
   Component
----------------------------- */
const Share: React.FC<{
}> = () => {
    const { id } = useParams<{ id?: string }>();
    const { VITE_APP_ENDPOINT } = import.meta.env;
    const [env, setEnv] = useState<ConfigType>(DEFAULT_ENV)
    const [census, setCensus] = useState<CensusEntry[]>([])
    const {
        canvasRef,
        spawnSpecies,
        clearAll
    } = useSim({ env, setCensus })

    /* ----------------------------
       Load tank
    ----------------------------- */
    const hasLoadedRef = useRef(false)

    useEffect(() => {
        if (!id || hasLoadedRef.current) return

        hasLoadedRef.current = true

        const getTank = async () => {
            clearAll()
            try {
                const tank = await axios.get(`${VITE_APP_ENDPOINT}aquarium/tanks/${id}`)
                if (tank?.data?.success) {
                    createTank(tank.data.tank)
                }
            } catch (e) {
                console.log(e)
            }
        }

        getTank()
    }, [id])

    const createTank = (tank: any) => {
        setEnv({
            accelScale: tank.accelScale,
            align: tank.align,
            alignNoise: tank.alignNoise,
            alignSaturation: tank.alignSaturation,
            canvasOpacity: tank.canvasOpacity,
            drag: tank.drag,
            k0: tank.k0,
            predatorRadius: tank.predatorRadius,
            predatorStrength: tank.predatorStrength,
            wallStrength: tank.wallStrength,
            wallMargin: tank.wallMargin,
        })
        tank.census.forEach((spec: CensusEntry) => {
            let index = spec.species === "torpedo" ? 2 : spec.species === "drifter" ? 1 : 0
            spawnSpecies(generateOrgType(ORG_SHAPES[index], spec), spec.count, spec.color)
        })
    }

    /* ----------------------------
       Render
    ----------------------------- */
    return (
        <Styled.Div>
            <canvas ref={canvasRef} />
            <Link to={'/'}>
                <Logo />
            </Link>

            {/* <Menu
                onAdd={() => setModalOpen(prevState => ({ ...prevState, spawn: true }))}
                onInfo={() => setModalOpen(prevState => ({ ...prevState, info: true }))}
                onChat={() => setModalOpen(prevState => ({ ...prevState, chat: true }))}
                onProfile={() => setModalOpen(prevState => ({ ...prevState, profile: true }))}
                onCensus={() => setModalOpen(prevState => ({ ...prevState, census: true }))}
                {...{ onSave, census, loggedIn }}
                save={isDirty}
            /> */}

            {/* <img
                src={settings}
                onClick={() =>
                    setModalOpen(m => ({ ...m, config: !m.config }))
                }
            />

            {modalOpen.config && <Config env={env} setEnv={setEnv} />} */}
        </Styled.Div>
    )
}

export default Share
