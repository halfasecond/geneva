import axios from 'axios'
import { useEffect, useState } from 'react'
import { fromWei } from 'web3-utils'
import { colorsAlternate } from 'kittyFamily/style/config'
import { genes } from '../../../server/modules/cryptokitties/geneData'

const { VITE_APP_ENDPOINT } = import.meta.env
const IMG = 'https://img.cryptokitties.co/0x06012c8cf97bead5deae237070f9587f8e7a266d'

const EXTRA_EYE: Record<string, string> = {
    gemini: '#d1eeeb',
    dioscuri: '#d1eeeb',
    kaleidoscope: '#000000',
}

const eyeBackground = (g8?: number, color?: string) => {
    const index = Number(g8)
    const fromGene = Number.isInteger(index) ? genes[index]?.ec : undefined
    const name = fromGene || color
    if (!name) return '#eee9e8'
    return colorsAlternate[name] || EXTRA_EYE[name] || '#eee9e8'
}

interface ClaimRow {
    tokenId: number
    amount: string
    timestamp?: string
}

interface KittyRow {
    tokenId: number
    gen: number
    g8?: number
    color?: string
    amount: string
}

const RecentClaims = () => {
    const [kitties, setKitties] = useState<KittyRow[] | undefined>()

    useEffect(() => {
        let cancel = false
        const load = async () => {
            try {
                const { data } = await axios.get<ClaimRow[]>(`${VITE_APP_ENDPOINT}purr/claims`)
                const newest = [...data]
                    .sort((a, b) => +new Date(b.timestamp || 0) - +new Date(a.timestamp || 0))
                    .slice(0, 20)
                if (!newest.length) {
                    if (!cancel) setKitties([])
                    return
                }
                const ids = newest.map((claim) => claim.tokenId)
                const { data: { kitties: found } } = await axios.get(
                    `${VITE_APP_ENDPOINT}cryptokitties/nfts?search=id:${ids.join(',')}`
                )
                const byId = new Map<number, { tokenId: number; gen: number; g8?: number; color?: string }>(
                    (found || []).map((kitty: { tokenId: number; gen: number; g8?: number; color?: string }) => [Number(kitty.tokenId), kitty])
                )
                const rows = newest.flatMap((claim) => {
                    const kitty = byId.get(Number(claim.tokenId))
                    if (!kitty) return []
                    return [{
                        tokenId: Number(kitty.tokenId),
                        gen: kitty.gen,
                        g8: kitty.g8,
                        color: kitty.color,
                        amount: claim.amount,
                    }]
                })
                if (!cancel) setKitties(rows)
            } catch (e) {
                console.log(e)
                if (!cancel) setKitties([])
            }
        }
        void load()
        return () => {
            cancel = true
        }
    }, [])

    if (!kitties?.length) return null

    return (
        <section className="purr-section bg-white text-black">
            <h2 className="font-display text-lg md:text-2xl lg:text-4xl text-center mb-12">
                Recent $PURR Claims
            </h2>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-x-3 gap-y-6 max-w-6xl mx-auto">
                {kitties.map((kitty) => (
                    <a
                        key={kitty.tokenId}
                        href={`https://www.cryptokitties.co/kitty/${kitty.tokenId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex flex-col items-center text-center text-[10px] font-bold leading-tight"
                    >
                        <span
                            className="relative block w-full aspect-square rounded-full overflow-hidden shadow-[0_0_6px_rgba(0,0,0,0.2)] mb-1"
                            style={{ backgroundColor: eyeBackground(kitty.g8, kitty.color) }}
                        >
                            <img
                                src={`${IMG}/${kitty.tokenId}.png`}
                                alt={`CryptoKitty #${kitty.tokenId}`}
                                className="absolute w-[160%] max-w-none -ml-[27%] -mt-[14%]"
                                onError={(e) => {
                                    const target = e.currentTarget
                                    target.onerror = null
                                    target.src = `${IMG}/${kitty.tokenId}.svg`
                                }}
                            />
                        </span>
                        <span>#{kitty.tokenId}</span>
                        <span>Gen{kitty.gen}</span>
                        <span>$PURR {fromWei(kitty.amount || '0', 'ether')}</span>
                    </a>
                ))}
            </div>
        </section>
    )
}

export default RecentClaims
