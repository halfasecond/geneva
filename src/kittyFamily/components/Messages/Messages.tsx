// @ts-nocheck
import { Link } from 'react-router-dom'
import KittyPfp from 'kittyFamily/components/KittyPfp'
import * as Styled from './Messages.style'
import logo from 'kittyFamily/svg/logo.svg'

const formatDate = (date) => {
    const d = new Date(date);
    const day = d.toLocaleDateString('en-GB', { day: 'numeric' });
    const month = d.toLocaleDateString('en-GB', { month: 'short' });
    const year = d.toLocaleDateString('en-GB', { year: 'numeric' });
    const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return `${day} ${month} ${year} ${time}`;
};

const Messages = ({ messages, profiles, results, hats }) => {
    return (
        <Styled.Div>
            {profiles && messages.map(({ account, createdAt, message }, i) => (
                <div key={i}>
                <Link to={`/profile/${account}`} onClick={e => e.preventDefault()}>
                    {results && (
                        profiles.find(({ address }) => address === account) ? (
                            <KittyPfp
                                getInfo={() => console.log('blob')}
                                kitty={results.find(({ tokenId }) => tokenId === profiles.find(({ address }) => address === account).avatar)}
                                hats={[...hats.filter(({ tokenId }) => tokenId === profiles.find(({ address }) => address === account).avatar)]}
                                bgColor={results.find(({ tokenId }) => tokenId === profiles.find(({ address }) => address === account).avatar).color}
                            />
                        ) : (
                            <img src={logo} alt={''} />
                        )
                    )}
                </Link>
                <div>
                    <div>
                        <Link to={`/profile/${account}`}>
                            {profiles.find(({ address }) => address === account)?.displayName || account}
                        </Link>
                        </div>
                        <div>{message}</div>
                        <div>- {formatDate(createdAt)}</div>
                    </div>
                </div>
            ))}
        </Styled.Div>
    )
}

export default Messages
