import * as Styled from './RecentEvents.style'
import Pfp from 'kittyNews/components/Pfp'

const kittyOf = (event: any, eventType: string) => (eventType === 'Transfer' ? event.kitty : event)

const RecentEvents: React.FC<{ events: any, eventType: string }> = ({ events, eventType }) => {
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
                return <Pfp key={i} kitty={kitty} value={event?.value} eventType={eventType} />
            })}
        </Styled.Section>
    )
}

export default RecentEvents