import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import Kitty from '../Kitty'
import FamilyLogo from '../FamilyLogo'
import { kittyImageUrl } from '../kittyImage'
import type { FamilyResponse, Kitty as KittyType } from '../types'
import * as Styled from '../FamilyTree/FamilyTree.style'

const { VITE_APP_ENDPOINT } = import.meta.env

/** Family tree: no large image overlays, no ground shadow. */
const TREE_KITTY_PROPS = { showMewts: false, showShadow: false } as const

const enrichFromCkApi = async (kitties: KittyType[]): Promise<KittyType[]> => {
    if (!kitties.length) return kitties

    const ids = kitties.map(({ tokenId }) => tokenId).join(',')
    const withFallback = kitties.map((kitty) => ({
        ...kitty,
        id: kitty.tokenId,
        image_url: kitty.image_url ?? kittyImageUrl(kitty.tokenId),
    }))

    try {
        const { data } = await axios.get<{
            kitties: Array<{ id: number; status?: string } & Record<string, unknown>>
        }>(`https://api.cryptokitties.co/v3/kitties?search=id:${ids}&limit=15`)

        return withFallback.map((kitty) => {
            const ck = data.kitties.find((entry) => entry.id === kitty.tokenId)
            if (!ck) return kitty

            const status = ck.status as { cooldown_index?: number } | undefined
            return {
                ...kitty,
                ...ck,
                tokenId: kitty.tokenId,
                id: ck.id,
                matronId: kitty.matronId,
                sireId: kitty.sireId,
                gen: kitty.gen,
                image_url: (ck.image_url as string | undefined) ?? kitty.image_url,
                color: (ck.color as string | undefined) ?? kitty.color,
                status: ck.status,
                enhanced_cattributes: ck.enhanced_cattributes as KittyType['enhanced_cattributes'],
                cooldownIndex: kitty.cooldownIndex ?? status?.cooldown_index,
            }
        })
    } catch {
        return withFallback
    }
}

const FamilyTree = () => {
    const { id } = useParams()
    const [kitties, setKitties] = useState<KittyType[] | undefined>(undefined)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!id) return

        let cancelled = false
        setKitties(undefined)
        setError(null)

        axios
            .get<FamilyResponse>(`${VITE_APP_ENDPOINT}cryptokitties/family?search=id:${id}`)
            .then(async ({ data }) => {
                if (cancelled) return
                const enriched = await enrichFromCkApi(data.kitties)
                if (!cancelled) setKitties(enriched)
            })
            .catch(() => {
                if (!cancelled) setError(`Kitty #${id} was not found in the database.`)
            })

        return () => {
            cancelled = true
        }
    }, [id])

    const getKitty = (_kitties: KittyType[]) =>
        _kitties.find(({ tokenId }) => tokenId.toString() === id)

    const getParent = (_kitties: KittyType[], type: 'matron' | 'sire') => {
        const focal = getKitty(_kitties)
        if (!focal) return undefined
        return _kitties.find(({ tokenId }) => tokenId === focal[`${type}Id`])
    }

    const getAncestor = (_kitties: KittyType[], ancestorId?: number) =>
        ancestorId == null ? undefined : _kitties.find(({ tokenId }) => tokenId === ancestorId)

    if (error) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
                <p className="text-kf-warm">{error}</p>
                <p className="mt-2 text-sm text-kf-warm/70">
                    The indexer may still be catching up — try again shortly.
                </p>
            </div>
        )
    }

    const focal = kitties ? getKitty(kitties) : undefined

    return (
        <Styled.Main className={`kf-family-tree ${focal?.color ?? ''}`}>
            {kitties !== undefined && focal && (
                <Styled.Section>
                    <Styled.Div className="row1">
                        <Kitty {...TREE_KITTY_PROPS} kitty={focal} />
                    </Styled.Div>

                    {focal.gen > 0 ? (
                        <>
                            <Styled.Hr style={{ width: '50%' }} />
                            <Styled.Div className="row2">
                                <Kitty {...TREE_KITTY_PROPS} kitty={getParent(kitties, 'matron')} />
                                <FamilyLogo />
                                <Kitty {...TREE_KITTY_PROPS} kitty={getParent(kitties, 'sire')} />
                            </Styled.Div>
                        </>
                    ) : (
                        <Styled.Div className="row2">
                            <FamilyLogo />
                        </Styled.Div>
                    )}

                    {focal.gen > 0 &&
                        ((getParent(kitties, 'matron')?.gen ?? 0) > 0 ||
                            (getParent(kitties, 'sire')?.gen ?? 0) > 0) && (
                            <>
                                <div style={{ display: 'flex' }}>
                                    <Styled.Hr
                                        style={{
                                            width: '25%',
                                            opacity: (getParent(kitties, 'matron')?.gen ?? 0) > 0 ? 1 : 0,
                                        }}
                                    />
                                    <Styled.Hr
                                        style={{
                                            width: '25%',
                                            opacity: (getParent(kitties, 'sire')?.gen ?? 0) > 0 ? 1 : 0,
                                        }}
                                    />
                                </div>
                                <Styled.Div className="row3">
                                    {(getParent(kitties, 'matron')?.gen ?? 0) > 0 ? (
                                        <>
                                            <Kitty
                                                {...TREE_KITTY_PROPS}
                                                kitty={getAncestor(
                                                    kitties,
                                                    getParent(kitties, 'matron')?.matronId,
                                                )}
                                            />
                                            <Kitty
                                                {...TREE_KITTY_PROPS}
                                                kitty={getAncestor(
                                                    kitties,
                                                    getParent(kitties, 'matron')?.sireId,
                                                )}
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <div />
                                            <div />
                                        </>
                                    )}
                                    {(getParent(kitties, 'sire')?.gen ?? 0) > 0 ? (
                                        <>
                                            <Kitty
                                                {...TREE_KITTY_PROPS}
                                                kitty={getAncestor(
                                                    kitties,
                                                    getParent(kitties, 'sire')?.matronId,
                                                )}
                                            />
                                            <Kitty
                                                {...TREE_KITTY_PROPS}
                                                kitty={getAncestor(
                                                    kitties,
                                                    getParent(kitties, 'sire')?.sireId,
                                                )}
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <div />
                                            <div />
                                        </>
                                    )}
                                </Styled.Div>
                                <div style={{ display: 'flex' }}>
                                    <Styled.Hr
                                        style={{
                                            width: '12.5%',
                                            opacity:
                                                (getAncestor(
                                                    kitties,
                                                    getParent(kitties, 'matron')?.matronId,
                                                )?.gen ?? 0) > 0
                                                    ? 1
                                                    : 0,
                                        }}
                                    />
                                    <Styled.Hr
                                        style={{
                                            width: '12.5%',
                                            opacity:
                                                (getAncestor(
                                                    kitties,
                                                    getParent(kitties, 'matron')?.sireId,
                                                )?.gen ?? 0) > 0
                                                    ? 1
                                                    : 0,
                                        }}
                                    />
                                    <Styled.Hr
                                        style={{
                                            width: '12.5%',
                                            opacity:
                                                (getAncestor(
                                                    kitties,
                                                    getParent(kitties, 'sire')?.matronId,
                                                )?.gen ?? 0) > 0
                                                    ? 1
                                                    : 0,
                                        }}
                                    />
                                    <Styled.Hr
                                        style={{
                                            width: '12.5%',
                                            opacity:
                                                (getAncestor(
                                                    kitties,
                                                    getParent(kitties, 'sire')?.sireId,
                                                )?.gen ?? 0) > 0
                                                    ? 1
                                                    : 0,
                                        }}
                                    />
                                </div>
                                <Styled.Div className="row4">
                                    {(getAncestor(kitties, getParent(kitties, 'matron')?.matronId)
                                        ?.gen ?? 0) > 0 ? (
                                        <>
                                            <Kitty
                                                {...TREE_KITTY_PROPS}
                                                kitty={getAncestor(
                                                    kitties,
                                                    getAncestor(
                                                        kitties,
                                                        getParent(kitties, 'matron')?.matronId,
                                                    )?.matronId,
                                                )}
                                            />
                                            <Kitty
                                                {...TREE_KITTY_PROPS}
                                                kitty={getAncestor(
                                                    kitties,
                                                    getAncestor(
                                                        kitties,
                                                        getParent(kitties, 'matron')?.matronId,
                                                    )?.sireId,
                                                )}
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <div />
                                            <div />
                                        </>
                                    )}
                                    {(getAncestor(kitties, getParent(kitties, 'matron')?.sireId)?.gen ??
                                        0) > 0 ? (
                                        <>
                                            <Kitty
                                                {...TREE_KITTY_PROPS}
                                                kitty={getAncestor(
                                                    kitties,
                                                    getAncestor(
                                                        kitties,
                                                        getParent(kitties, 'matron')?.sireId,
                                                    )?.matronId,
                                                )}
                                            />
                                            <Kitty
                                                {...TREE_KITTY_PROPS}
                                                kitty={getAncestor(
                                                    kitties,
                                                    getAncestor(
                                                        kitties,
                                                        getParent(kitties, 'matron')?.sireId,
                                                    )?.sireId,
                                                )}
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <div />
                                            <div />
                                        </>
                                    )}
                                    {(getAncestor(kitties, getParent(kitties, 'sire')?.matronId)?.gen ??
                                        0) > 0 ? (
                                        <>
                                            <Kitty
                                                {...TREE_KITTY_PROPS}
                                                kitty={getAncestor(
                                                    kitties,
                                                    getAncestor(
                                                        kitties,
                                                        getParent(kitties, 'sire')?.matronId,
                                                    )?.matronId,
                                                )}
                                            />
                                            <Kitty
                                                {...TREE_KITTY_PROPS}
                                                kitty={getAncestor(
                                                    kitties,
                                                    getAncestor(
                                                        kitties,
                                                        getParent(kitties, 'sire')?.matronId,
                                                    )?.sireId,
                                                )}
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <div />
                                            <div />
                                        </>
                                    )}
                                    {(getAncestor(kitties, getParent(kitties, 'sire')?.sireId)?.gen ??
                                        0) > 0 ? (
                                        <>
                                            <Kitty
                                                {...TREE_KITTY_PROPS}
                                                kitty={getAncestor(
                                                    kitties,
                                                    getAncestor(
                                                        kitties,
                                                        getParent(kitties, 'sire')?.sireId,
                                                    )?.matronId,
                                                )}
                                            />
                                            <Kitty
                                                {...TREE_KITTY_PROPS}
                                                kitty={getAncestor(
                                                    kitties,
                                                    getAncestor(
                                                        kitties,
                                                        getParent(kitties, 'sire')?.sireId,
                                                    )?.sireId,
                                                )}
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <div />
                                            <div />
                                        </>
                                    )}
                                </Styled.Div>
                            </>
                        )}
                </Styled.Section>
            )}
        </Styled.Main>
    )
}

export default FamilyTree