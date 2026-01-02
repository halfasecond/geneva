import { CensusEntry } from '../types'
import * as Styled from './Menu.style'
import add from './svg/add.svg'
import census from './svg/census.svg'
import chat from './svg/chat.svg'
import info from './svg/info.svg'
import profile from './svg/profile.svg'
import save from './svg/save.svg'

const icons = [add, info, chat, profile, census, save]
const labels = ['add', 'info', 'chat', 'profile', 'census', 'save']

type Props = {
    onAdd: () => void
    onInfo: () => void
    onChat: () => void
    onProfile: () => void
    onCensus: () => void
    census: CensusEntry[]
    onSave: () => void
    save: boolean
    loggedIn: string
}

const Menu: React.FC<Props> = ({ onAdd, onInfo, onChat, onProfile, onCensus, onSave, save, census, loggedIn }) => {
    const actions = [onAdd, onInfo, onChat, onProfile, onCensus, onSave]
    return (
        <Styled.Div>
            {icons.map((icon, i: number) => {
                return (
                    <div key={i} onClick={actions[i]} style={(!loggedIn && (labels[i] === 'chat' || labels[i] === 'save')) || (labels[i] === 'census' && census.length === 0) ? {
                        opacity: 0.2, cursor: 'default'
                    } : loggedIn && labels[i] === 'save' ? save ? { opacity: 1 } : {} : {}}>
                        <img src={icon} />
                        <p>{!loggedIn && labels[i] === 'profile' ? 'login' : labels[i]}</p>
                    </div>
                )
            })}
        </Styled.Div>
    )
}

export default Menu