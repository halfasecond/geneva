// @ts-nocheck
import * as Styled from './PriceC2A.style'
import { fromWei } from 'web3-utils'
import loadingSrc from 'kittyFamily/svg/loading.svg'

const unPad = (str) => String(str || '0').replace(/^0+/, '') || '0'

const formatEth = (price) => {
	try {
		return fromWei(unPad(price), 'ether')
	} catch {
		return ''
	}
}

const PriceC2A = ({ price, disabled, loading, handleClick, sale=true }) => {
	return (
		<Styled.Span {...{ disabled }} onClick={() => !disabled && handleClick(unPad(price))}>
			<img src={sale ? '/images/icons/buy.svg' : '/images/icons/eggplant.svg'} />
			{loading ? (
				<img src={loadingSrc} alt="" />
			) : (
				<>
					<span>Ξ</span>
					{price ? formatEth(price) : ''}
				</>
			)}
		</Styled.Span>
	)
}

export default PriceC2A
