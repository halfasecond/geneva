import * as Styled from './RecentEvents.style'
import Pfp from 'kittyNews/components/Pfp'

const RecentEvents: React.FC<{ events: any, eventType: string }> = ({ events, eventType }) => {
    return (
        <Styled.Section>
            <h2>
                {eventType === 'Transfer' && 'Recent Sales'}
                {eventType === 'Birth' && 'New Born Kitties'}
                {eventType === 'PurrClaim' && 'Recent $PURR Claims'}
            </h2>
            {events && events.map((event: any, i: number) => (
                <Pfp key={i} kitty={eventType === 'Transfer' ? event.kitty : event} value={event?.value} eventType={eventType} />
                
            ))}
        </Styled.Section>
    )
}

export default RecentEvents