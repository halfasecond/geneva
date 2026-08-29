// @ts-nocheck
import * as Styled from './Notifications.style'
import { Link } from 'react-router-dom'

const Notifications = ({ notifications }) => {
    return (
        <Styled.Div id={'notifications'}>
            {notifications.map(({ tokenId, note, type }, i) => {
                if (type === 'Pregnant') {
                    return (
                        <div key={i}>
                            <div><img src={'/images/icons/eggplant.svg'} alt={'Pregnant'} /></div>
                            <div>
                                <Link to={`/kitty/1`}>{`Kitty #1}`}</Link> and 
                                <Link to={`/kitty/2`}>{`Kitty #2`}</Link>  just made it a night to remember
                            </div>
                        </div>
                    )
                }
                if (type === 'Birth') {
                    return note ? ( // if both parents are 0 then this must be a gen0
                        <div key={i}>
                            <div><img src={'/images/icons/gen0.svg'} alt={'Kitty Clock'} /></div>
                            <div>The <Link to={`/search?include=sale&search=gen:0`}>Kitty Clock</Link> just released a new Gen0 kitty: <Link to={`/kitty/1`}>{`Kitty #1`}</Link></div>
                        </div>
                    ) : (
                        <div key={i}>
                            <div><img src={'/images/icons/egg.svg'} alt={'Birth'} /></div>
                            <div><Link to={`/kitty/${tokenId}`}>{`Kitty #${tokenId}`}</Link> just hatched...</div>
                        </div>
                    )
                }
                if (type === 'AuctionSuccessful') {
                    const explodeNote = note.split(" ")
                    if (explodeNote.length === 3) {
                        return (
                            <div key={i}>
                                <div><img src={'/images/icons/receive.svg'} alt={'Pregnant'} /></div>
                                <div><Link to={`/profile/${explodeNote[2]}`}>{explodeNote[2].substring(0, 12) + '...'}</Link> just bought <Link to={`/kitty/${explodeNote[1]}`}>{`Kitty #${explodeNote[1]}`}</Link></div>
                            </div>
                        )
                    }
                }
            })}
        </Styled.Div>
    )
}

export default Notifications