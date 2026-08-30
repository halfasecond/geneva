// @ts-nocheck
import { Fragment, useEffect, useState, useRef } from 'react'
import * as Styled from './KittyPfp.style'
import { Link } from 'react-router-dom'
import Confetti from 'kittyFamily/components/Confetti'
import Jewels from 'kittyFamily/components/Jewels'
import inspect from 'kittyFamily/svg/inspect.svg'
import PriceC2A from 'kittyFamily/components/PriceC2A'
import meta from 'kittyFamily/components/KittyHats/meta'
import Portal from 'kittyFamily/components/Portal'
import closeSrc from 'kittyFamily/svg/close.svg'
import { handleGetCoolDown, handleGetBirthday, handleGetAbbrBirthday, isTinyBoxCattribute } from 'kittyFamily/utils'

const CK_IMG = 'https://img.cryptokitties.co/0x06012c8cf97bead5deae237070f9587f8e7a266d/'
const kittyArt = (kitty) =>
	kitty?.image_url ||
	kitty?.image_url_cdn ||
	`${CK_IMG}${kitty?.tokenId === 0 ? '--' : kitty?.tokenId}.png`

const Kitty = ({ kitty, getInfo, handlePurchase, showMewts=false, showInfo = true, c2aPosition = 'top', showName = false, showBirthday, handleClick = undefined, bgColor = undefined, size ='80px' }) => {
	const [purchasing, setPurchasing] = useState(false)
	const [purchased, setPurchased] = useState(false)
	const [modal, setModal] = useState(false)

	const _handlePurchase = async (tokenId, price) => {
		setPurchasing(true)
		try {
			const purchase = await handlePurchase(tokenId, price)
			if (purchase) {
				setPurchasing(false)
				setPurchased(true)
				setModal(true)
			} else {
				setPurchasing(false)
			}
		} catch (e) {
			setPurchasing(false)
		}
	}

	const modalOverlayRef = useRef(null)

	useEffect(() => {
		modal
			? document.body.style.overflow = 'hidden'
			: document.body.style.overflow = 'auto'
		return () => {
			document.body.style.overflow = 'auto'
		}
	}, [modal])

	const handleOverlayClick = (event) => modalOverlayRef.current && event.target === modalOverlayRef.current && setModal(false)
	const handleKeyDown = (event) => event.key === 'Escape' && setModal(false) // Attach a keydown event listener to close the modal on pressing the "Escape" key

	useEffect(() => {
		document.addEventListener('click', handleOverlayClick)
		document.addEventListener('keydown', handleKeyDown)
		return () => {
			document.removeEventListener('click', handleOverlayClick);
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [setModal])

	return (
		<>
			{modal &&
				<Portal>
					<Styled.Modal>
						<div>
							<img className={'close'} src={closeSrc} alt="" onClick={() => setModal(false)} />
							<h2>{'Congratulations'}</h2>
							<p>Your new kitty has arrived! If you would like a hat for your kitty you can <Link to={'/kitty-hats-marketplace'}>find one here</Link></p>
							<Styled.Container>
								<Styled.ImageContainer className={kitty.color} style={{ cursor: getInfo ? 'pointer' : 'default' }}>
									<img src={kittyArt(kitty)} alt={'Cryptokitty ' + (kitty.tokenId || kitty.id)} onClick={() => getInfo(kitty.id || kitty.tokenId)}
										onError={({ currentTarget }) => {
											currentTarget.onerror = null
											currentTarget.src = `https://img.cn.cryptokitties.co/0x06012c8cf97bead5deae237070f9587f8e7a266d/103.png`
										}}
									/>
									{kitty.hats && kitty.hats.map((hat, i) => {
										const _meta = meta.find(m => m.contract.toLowerCase() === `Item${hat.itemName}`.toLowerCase())
										return hat.itemName.split('Dada').length === 1
											? <img key={i} src={`/images/kitty-hats/asset/${_meta.assetUrl}.svg`} alt={hat.itemName} onClick={() => getInfo(kitty.id)} className={`kitty-hat ${_meta.assetUrl}`} />
											: <Fragment key={i}>
												<img src={`/images/kitty-hats/asset/easel.svg`} alt={'easel'} onClick={() => getInfo(kitty.id)} className={'kitty-hat easel'} />
												<img src={`/images/kitty-hats/asset/${_meta.assetUrl}.png`} alt={hat.itemName} onClick={() => getInfo(kitty.id)} className={'kitty-hat dada'} />
											</Fragment>
									})}
								</Styled.ImageContainer>
								<h3><img src={'/images/icons/normal.svg'} alt={''} /><Link to={`/kitty/${kitty.tokenId}`}>#{kitty.tokenId}{kitty.name && ` - ${kitty.name}`}</Link></h3>
								<h4>Gen{kitty.gen} - {handleGetCoolDown(kitty.cooldownIndex)}</h4>
							</Styled.Container>
						</div>
					</Styled.Modal>
					<Confetti />
				</Portal>
			}
			<Styled.Container>
				{kitty && kitty.image_url && (
					<>
						<Styled.ImageContainer {...{ size }} className={`${bgColor}${(kitty.is_exclusive || kitty.is_fancy || kitty.is_special_edition) ? `` : ' shadow'}${isTinyBoxCattribute(kitty) ? ' tinybox' : ''}`} style={{ cursor: getInfo ? 'pointer' : 'default' }}>
							<div>
								<img src={kitty.image_url} alt={'Cryptokitty ' + kitty.id} onClick={() => getInfo(kitty.id)}
									onError={({ currentTarget }) => {
										currentTarget.onerror = null
										currentTarget.src = `https://img.cn.cryptokitties.co/0x06012c8cf97bead5deae237070f9587f8e7a266d/103.png`
									}}
								/>
								{kitty.hats && kitty.hats.map((hat, i) => {
									const _meta = meta.find(m => m.contract.toLowerCase() === `Item${hat.itemName}`.toLowerCase())
									return hat.itemName.split('Dada').length === 1
										? <img key={i} src={`/images/kitty-hats/asset/${_meta.assetUrl}.svg`} alt={hat.itemName} onClick={() => getInfo(kitty.id)} className={`kitty-hat ${_meta.assetUrl}`} />
										: <Fragment key={i}>
											<img src={`/images/kitty-hats/asset/easel.svg`} alt={'easel'} onClick={() => getInfo(kitty.id)} className={'kitty-hat easel'} />
											<img src={`/images/kitty-hats/asset/${_meta.assetUrl}.png`} alt={hat.itemName} onClick={() => getInfo(kitty.id)} className={'kitty-hat dada'} />
										</Fragment>
								})}
							</div>
						</Styled.ImageContainer>
					</>
				)}
			</Styled.Container>
		</>

	)
}



export default Kitty
