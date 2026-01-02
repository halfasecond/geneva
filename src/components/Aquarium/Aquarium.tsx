import React, { useCallback, useEffect, useMemo, useState } from "react"
import { OrgType, ConfigType, CensusEntry } from "./types"
import { DEFAULT_ENV, generateRandomOrgType, generateOrgType, ORG_SHAPES } from "./spec"
import { useChat } from "./hooks/useChat"
import { useSim } from "./hooks/useSim"
import Census from "./Census"
import ChatRoom from "./ChatRoom"
import Config from "./Config"
import Info from "./Info"
import Logo from "./Logo"
import Menu from "./Menu"
import Modal from "../Modal"
import Profile from "./Profile"
import Spawn from "./Spawn"
import settings from "./settings.svg"
import * as Styled from "./Aquarium.style"

/* ----------------------------
   Helpers
----------------------------- */
const stripDraw = (type: any) => {
    const { draw, ...rest } = type
    return rest
}

const createSaveObject = (census: CensusEntry[], env: ConfigType) => {
    return {
        ...env,
        census: census.map(c => ({
            color: c.color,
            count: c.count,
            ...stripDraw(c.type)
        }))
    }
}

const deepEqual = (a: any, b: any) =>
    JSON.stringify(a) === JSON.stringify(b)

/* ----------------------------
   Component
----------------------------- */
const Aquarium: React.FC<{
    token?: string
    handleSignIn: () => void
    handleSignOut: () => void
    BASE_URL: string
    loggedIn?: string
}> = ({ token, handleSignIn, handleSignOut, BASE_URL, loggedIn }) => {
    const [env, setEnv] = useState<ConfigType>(DEFAULT_ENV)
    const [census, setCensus] = useState<CensusEntry[]>([])
    const [selected, setSelected] = useState<OrgType | null>(null)
    const [shareLink, setShareLink] = useState<string | undefined>(undefined)

    const [savedSnapshot, setSavedSnapshot] = useState<any | null>(null)

    const [modalOpen, setModalOpen] = useState({
        spawn: false,
        config: false,
        info: false,
        profile: false,
        chat: false,
        census: false,
    })

    const { connected, messages, addMessage, saveTank, tankSaved, tank } = useChat({ token })
    const {
        canvasRef,
        spawnSpecies,
        editSpecies,
        deleteSpecies,
        setSpeciesPopulation,
        clearAll
    } = useSim({ env, setCensus })

    /* ----------------------------
       Derived current snapshot
    ----------------------------- */
    const currentSnapshot = useMemo(
        () => createSaveObject(census, env),
        [census, env]
    )

    const isDirty = useMemo(() => {
        if (!loggedIn) return false
        return !deepEqual(savedSnapshot, currentSnapshot)
    }, [savedSnapshot, currentSnapshot, census])

    useEffect(() => {
        if (savedSnapshot === null && currentSnapshot.census.length > 0) {
            setSavedSnapshot({
                ...currentSnapshot
            })
        }
    }, [savedSnapshot, currentSnapshot, loggedIn])

    /* ----------------------------
       Spawn
    ----------------------------- */
    const handleSpawn = useCallback(
        (species: OrgType, count: number) => {
            setModalOpen(m => ({ ...m, spawn: false }))
            spawnSpecies(species, count)
        },
        [spawnSpecies]
    )

    /* ----------------------------
       Load tank
    ----------------------------- */
    useEffect(() => {
        clearAll()
        if (!loggedIn) {
            spawnSpecies(generateRandomOrgType(ORG_SHAPES[0]), 10)
            spawnSpecies(generateRandomOrgType(ORG_SHAPES[0]), 10)
            spawnSpecies(generateRandomOrgType(ORG_SHAPES[0]), 20)
            spawnSpecies(generateRandomOrgType(ORG_SHAPES[2]), 20)
            spawnSpecies(generateRandomOrgType(ORG_SHAPES[2]), 10)
            spawnSpecies(generateRandomOrgType(ORG_SHAPES[2]), 30)
            spawnSpecies(generateRandomOrgType(ORG_SHAPES[1]), 10)
            spawnSpecies(generateRandomOrgType(ORG_SHAPES[1]), 10)
        }
    }, [loggedIn])

    /* ----------------------------
       Save
    ----------------------------- */
    const onSave = () => saveTank(currentSnapshot)

    useEffect(() => {
        if (tankSaved !== undefined) {
            setSavedSnapshot(currentSnapshot)
        }
    }, [tankSaved])

    useEffect(() => {
        if (!(tank === undefined)) {
            if (tank.tank !== null) {
                createTank(tank.tank)
                setShareLink(tank.tank._id)
            }
        }
    }, [tank])

    useEffect(() => {
        if (census.length === 0 && modalOpen.census) {
            setModalOpen(prevState => ({ ...prevState, census: false }))
        }
    }, [census.length, modalOpen.census])

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

            <Logo />

            <Menu
                onAdd={() => setModalOpen(prevState => ({ ...prevState, spawn: true }))}
                onInfo={() => setModalOpen(prevState => ({ ...prevState, info: true }))}
                onChat={() => setModalOpen(prevState => ({ ...prevState, chat: true }))}
                onProfile={() => setModalOpen(prevState => ({ ...prevState, profile: true }))}
                onCensus={() => setModalOpen(prevState => ({ ...prevState, census: true }))}
                {...{ onSave, census, loggedIn }}
                save={isDirty}
            />

            <img
                src={settings}
                onClick={() =>
                    setModalOpen(m => ({ ...m, config: !m.config }))
                }
            />

            {modalOpen.config && <Config env={env} setEnv={setEnv} />}

            <Modal
                visible={modalOpen.spawn}
                close={() => setModalOpen(prevState => ({ ...prevState, spawn: false }))}
                style={{ background: "rgba(0,0,0,0.5)" }}
            >
                <Spawn onSpawn={handleSpawn} />
            </Modal>

            <Modal
                visible={modalOpen.info}
                close={() => setModalOpen(prevState => ({ ...prevState, info: false }))}
                style={{ background: "rgba(0,0,0,0.5)" }}
            >
                <Info onClose={() => setModalOpen(prevState => ({ ...prevState, info: false }))} />
            </Modal>

            {loggedIn && (
                <ChatRoom
                    isOpen={modalOpen.chat}
                    handleClose={() => setModalOpen(prevState => ({ ...prevState, chat: false }))}
                    onSendMessage={addMessage}
                    messages={messages}
                    connected={connected}
                />
            )}

            <Modal
                visible={modalOpen.profile}
                close={() => setModalOpen(prevState => ({ ...prevState, profile: false }))}
                style={{ background: "rgba(0,0,0,0.5)" }}
            >
                <Profile
                    {...{ handleSignIn, handleSignOut, token, loggedIn, BASE_URL, shareLink }}
                    onClose={() => setModalOpen(prevState => ({ ...prevState, profile: false }))}
                />
            </Modal>

            <Modal
                visible={modalOpen.census}
                close={() => setModalOpen(prevState => ({ ...prevState, census: false }))}
                style={{ background: "rgba(0,0,0,0.5)" }}
            >
                <Census
                    entries={census}
                    selected={selected}
                    onSelect={setSelected}
                    onApply={editSpecies}
                    onDelete={deleteSpecies}
                    onDeleteAll={clearAll}
                    onSetPopulation={setSpeciesPopulation}
                    onClose={() => setModalOpen(prevState => ({ ...prevState, census: false }))}
                />
            </Modal>

        </Styled.Div>
    )
}

export default Aquarium
