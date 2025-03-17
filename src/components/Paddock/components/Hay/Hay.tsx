import { getAssetPath } from 'src/utils/assetPath'
import * as Styled from './Hay.style'

const Hay = ({ hay }) => {
    return (
        <Styled.Div
        ><img src={getAssetPath('/svg/hay.svg')} /> $HAY: {hay}</Styled.Div>
    )
}

export default Hay