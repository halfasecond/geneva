import { useEffect, useState } from "react"
import Card from "../Card"
import Icon from "../Icon"
import Modal from "../../Modal"
import Slider from "../Slider"
import { CensusEntry, OrgType } from "../types"
import { ORG_STAT_SPECS } from '../spec'
import * as Styled from './Census.style'

type Props = {
    entries: CensusEntry[]
    selected: OrgType | null
    onSelect: (type: OrgType | null) => void
    onApply: (original: OrgType, updated: OrgType) => void
    onDelete: (type: OrgType) => void
    onDeleteAll: () => void
    onSetPopulation: (type: OrgType, color: string, targetCount: number) => void
    onClose: () => void
}

const Census: React.FC<Props> = ({
    entries,
    selected,
    onSelect,
    onApply,
    onDelete,
    onDeleteAll,
    onSetPopulation,
    onClose,
}) => {
    /* ----------------------------
       Draft state (UI-only)
    ----------------------------- */
    const [draft, setDraft] = useState<OrgType | null>(null)
    const [draftPopulation, setDraftPopulation] = useState<number>(0)

    // Sync draft when selection changes
    useEffect(() => {
        if (!selected) {
            setDraft(null)
            setDraftPopulation(0)
            return
        }

        const entry = entries.find(e => e.type === selected)
        if (!entry) return

        setDraft({ ...selected })
        setDraftPopulation(entry.count)
    }, [selected, entries])

    const hasChanges = (() => {
        if (!draft || !selected) return false

        // population changed
        const entry = entries.find(e => e.type === selected)
        if (entry && entry.count !== draftPopulation) return true

        // any stat changed
        return (Object.keys(ORG_STAT_SPECS) as (keyof typeof ORG_STAT_SPECS)[])
            .some(key => draft[key] !== selected[key])
    })()

    const entry = entries.find(e => e.type === selected)!

    return (
        <>
            {/* ----------------------------
               Selected species editor
            ----------------------------- */}
            {draft ? (
                <Modal visible={true} close={() => {
                    setDraft(null)
                    setDraftPopulation(0)
                    onSelect(null)
                }} style={{ background: "rgba(0,0,0,0.5)" }}>
                    <Card onClose={() => onSelect(null)}>
                        {entry && (
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <Icon type={entry.type} color={entry.color} />
                            </div>
                        )}

                        {/* Population */}
                        <Slider
                            label="population"
                            min={1}
                            max={100}
                            step={1}
                            value={draftPopulation}
                            toFixed={0}
                            onChange={(v: number) => setDraftPopulation(v)}
                        />

                        {/* Behaviour stats */}
                        {(Object.keys(ORG_STAT_SPECS) as (keyof typeof ORG_STAT_SPECS)[]).map(
                            (key) => {
                                const spec = ORG_STAT_SPECS[key]
                                return (
                                    <Slider
                                        key={key}
                                        label={spec.label ?? key.replace('S', ' s').replace('R', ' r')}
                                        min={spec.min}
                                        max={spec.max}
                                        step={spec.step ?? 0.01}
                                        value={draft[key]}
                                        onChange={(v: number) =>
                                            setDraft(prev =>
                                                prev
                                                    ? { ...prev, [key]: v }
                                                    : prev
                                            )
                                        }
                                    />
                                )
                            }
                        )}

                        {/* ----------------------------
                            Actions
                        ----------------------------- */}
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <Styled.Button
                                onClick={() => {
                                    onDelete(selected!)
                                    setDraft(null)
                                    onSelect(null)
                                }}
                                style={{ color: "#f00", marginLeft: 4, marginRight: 4 }}
                            >
                                Delete
                            </Styled.Button>

                            <Styled.Button
                                disabled={!hasChanges}
                                onClick={() => {
                                    onSetPopulation(entry.type, entry.color, draftPopulation)
                                    onApply(selected!, draft)
                                    onSelect(null)
                                }}
                                style={{
                                    opacity: hasChanges ? 1 : 0.4,
                                    cursor: hasChanges ? "pointer" : "default",
                                    marginLeft: 4
                                }}
                            >
                                Apply
                            </Styled.Button>
                        </div>
                    </Card>
                </Modal>
            ) : (
                <Card onClose={onClose} style={{ width: 280 }}>
                    <h2>Census</h2>
                    <Styled.Div>
                        {entries.map((entry, i) => (
                            <div
                                key={i}
                                onClick={() => onSelect(entry.type)}
                            >
                                <Icon type={entry.type} color={entry.color} />
                                <span>{entry.count}</span>
                            </div>
                        ))}
                    </Styled.Div>
                    <Styled.Button onClick={onDeleteAll}>start over</Styled.Button>
                </Card>
            )}

           
        </>
    )
}

export default Census
