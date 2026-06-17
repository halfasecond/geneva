import type { Kitty } from '../types'
import { getJewelGems, type JewelDisplayType } from './jewelUtils'
import * as Styled from './Jewels.style'

interface JewelsProps {
    kitty: Kitty
    displayType: JewelDisplayType
    /** Skip the empty placeholder (used on the image overlay). */
    hideEmpty?: boolean
}

const Jewels = ({ kitty, displayType, hideEmpty = false }: JewelsProps) => {
    const gems = getJewelGems(kitty, displayType)

    if (!gems.length) {
        if (hideEmpty) return null
        return (
            <Styled.Div>
                <Styled.Jewel $type="none" />
            </Styled.Div>
        )
    }

    return (
        <Styled.Div>
            {gems.map((gem, i) => (
                <Styled.Jewel
                    key={i}
                    $type={gem.type}
                    $trait={gem.trait}
                    $displayType={displayType}
                />
            ))}
        </Styled.Div>
    )
}

export default Jewels