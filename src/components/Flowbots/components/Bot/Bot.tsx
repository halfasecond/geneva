import * as Styled from './Bot.style'
import linesBG from './images/lines.png'
import { parts } from './parts'
import battery25 from './images/battery25.svg'
import battery50 from './images/battery50.svg'
import battery75 from './images/battery75.svg'
import battery100 from './images/battery100.svg'
import { Bot as BotType } from './bot.types'

interface Props {
    bot: BotType,
    lines: boolean
}

const Bot: React.FC<Props> = ({ bot, lines }) => {
    const _type = bot.isPrime ? 'type2' : 'type1'
    const battery = bot.power >= 65 ? battery100 : bot.power >= 55 ? battery75 : bot.power > 25 ? battery50 : battery25
    return (
        <Styled.Bot>
            <div>
                
                <img src={parts.arms[_type][bot.arms]} alt={''} />
                <img src={parts.legs[_type][bot.legs]} alt={''} />
                <img src={parts.body[_type][bot.body]} alt={''} />
                <img src={parts.head[_type][bot.head]} alt={''} />
                <img src={parts.panel[_type][bot.panel]} alt={''} />
                <img src={parts.grill[_type][bot.grill]} alt={''} />
                {lines && <img src={linesBG} alt={''} className={'lines'} />}
            </div>
            <div>
                <div><img src={battery} alt={`${bot.power}%`} /></div>
                <div>{bot.awards.map((award, i) => <img src={`/${award === 'Very Amorous' ? 'amorous2' : award.toLowerCase()}.svg`} key={i} alt={award} />)}</div>
                <span>{bot.issue}</span>
            </div>
        </Styled.Bot>
    )
}

export default Bot