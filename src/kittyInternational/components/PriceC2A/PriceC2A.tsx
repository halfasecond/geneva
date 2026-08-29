import { fromWei } from 'web3-utils'
import * as Styled from './PriceC2A.style'
import loadingSvg from 'kittyInternational/svg/loading.svg'

const unPad = (str: string) => str.replace(/^0+/, '') || '0'

const PriceC2A = ({
    price,
    disabled,
    loading,
    handleClick,
    sale,
}: {
    price?: string
    disabled?: boolean
    loading?: boolean
    handleClick: (price: string) => void
    sale?: boolean
}) => {
    const wei = price ? unPad(price) : '0'
    let eth = ''
    try {
        eth = fromWei(wei, 'ether')
    } catch {
        eth = ''
    }

    return (
        <Styled.Span $disabled={disabled} onClick={() => !disabled && handleClick(wei)}>
            <img src={sale ? '/images/icons/buy.svg' : '/images/icons/eggplant.svg'} alt="" />
            {loading ? (
                <img src={loadingSvg} alt="" />
            ) : (
                <>
                    <span>Ξ</span>
                    {eth}
                </>
            )}
        </Styled.Span>
    )
}

export default PriceC2A
