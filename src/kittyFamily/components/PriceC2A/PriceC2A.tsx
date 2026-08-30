// @ts-nocheck
import * as Styled from './PriceC2A.style'
import loadingSrc from 'kittyFamily/svg/loading.svg'

const unPad = (str) => String(str || '0').replace(/^0+/, '') || '0'

/** Display only. Purchase still uses unpadded wei. */
const formatEth = (price) => {
	try {
		const wei = unPad(price)
		if (!/^\d+$/.test(wei)) return ''
		const padded = wei.padStart(18, '0')
		let whole = padded.slice(0, -18).replace(/^0+/, '') || '0'
		const frac18 = padded.slice(-18)
		const head = frac18.slice(0, 8)
		const roundUp = frac18[8] >= '5'
		let fracInt = BigInt(head) + (roundUp ? 1n : 0n)
		if (fracInt === 100000000n) {
			whole = String(BigInt(whole) + 1n)
			fracInt = 0n
		}
		const frac = fracInt.toString().padStart(8, '0').replace(/0+$/, '')
		return frac ? `${whole}.${frac}` : whole
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
