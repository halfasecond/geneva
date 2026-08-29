import * as Styled from './Jewels.style'
import { KittyRecord } from 'kittyInternational/types/kitty'

const Jewels = ({ kitty, displayType }: { kitty: KittyRecord; displayType: 'mewtations' | 'family-jewels' }) => {
    const traits = kitty.enhanced_cattributes || []
    const id = kitty.id ?? kitty.tokenId
    return (
        <Styled.Div>
            {traits.map((c, i) => {
                const own = c.kittyId === id
                if (displayType === 'mewtations' && !own) return null
                if (displayType === 'family-jewels' && own) return null
                const position = c.position ?? 0
                const type =
                    position === 1 ? 'diamond'
                    : position <= 10 ? 'gilded'
                    : position <= 100 ? 'amethyst'
                    : position <= 500 ? 'lapis'
                    : undefined
                if (!type) return null
                return (
                    <Styled.Jewel
                        key={i}
                        $type={type}
                        $trait={c.description}
                        $larger={displayType === 'mewtations'}
                    />
                )
            })}
        </Styled.Div>
    )
}

export default Jewels
