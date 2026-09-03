import { useEffect, useState } from 'react'
import axios from 'axios'
import * as Styled from './RecentEvents.style'
import Pfp from 'kittyNews/components/Pfp'

const CK_API = 'https://api.cryptokitties.co/v3/kitties'

const kittyOf = (event: any, eventType: string) => (eventType === 'Transfer' ? event.kitty : event)

const RecentEvents: React.FC<{ events: any, eventType: string }> = ({ events, eventType }) => {
    const [traits, setTraits] = useState<Record<number, any[]>>({})

    useEffect(() => {
        if (!Array.isArray(events) || !events.length) return
        const ids = [...new Set(
            events
                .map((event: any) => Number(kittyOf(event, eventType)?.tokenId))
                .filter((id: number) => Number.isFinite(id) && id >= 0),
        )]
        if (!ids.length) return
        let cancelled = false
        axios.get(`${CK_API}?search=id:${ids.join(',')}&limit=${ids.length}`)
            .then(({ data }) => {
                if (cancelled) return
                const next: Record<number, any[]> = {}
                for (const ck of data?.kitties || []) {
                    if (ck?.id != null && Array.isArray(ck.enhanced_cattributes)) {
                        next[Number(ck.id)] = ck.enhanced_cattributes
                    }
                }
                setTraits(next)
            })
            .catch((error) => console.error('family jewels', error))
        return () => { cancelled = true }
    }, [events, eventType])

    return (
        <Styled.Section>
            <h2>
                {eventType === 'Transfer' && 'Recent Sales'}
                {eventType === 'Birth' && 'New Born Kitties'}
                {eventType === 'PurrClaim' && 'Recent $PURR Claims'}
            </h2>
            {events && events.map((event: any, i: number) => {
                const kitty = kittyOf(event, eventType)
                if (!kitty) return null
                const merged = traits[Number(kitty.tokenId)]
                    ? { ...kitty, enhanced_cattributes: kitty.enhanced_cattributes || traits[Number(kitty.tokenId)] }
                    : kitty
                return <Pfp key={i} kitty={merged} value={event?.value} eventType={eventType} />
            })}
        </Styled.Section>
    )
}

export default RecentEvents