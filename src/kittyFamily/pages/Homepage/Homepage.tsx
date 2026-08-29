// @ts-nocheck
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from 'kittyFamily/components/Logo'
import FeaturedKitties from 'kittyFamily/components/FeaturedKitties'
import KittyHats from 'kittyFamily/components/KittyHats'
import Search from 'kittyFamily/components/Search'
import ZenCalculator from 'kittyFamily/components/ZenCalculator'
import * as Styled from './Homepage.style'


const randomize = (array, count) => array.sort(() => 0.5 - Math.random()).slice(0, count)

const Homepage = ({ total, hats, loggedIn, searchables, web3, handleHatPurchase, handleHatPurchaseAndApply, handleSignIn }) => {
    const navigate = useNavigate()

	const [kittyID, setKittyID] = useState('')
    const [featuredHats, setFeaturedHats] = useState(undefined)
    useEffect(() => {
        if (hats) {
            setFeaturedHats(randomize([...hats.filter(({ available }) => available)], 5))
        }
    }, [hats])
    
	return (
		<Styled.Main>
			<Logo />
			<p>{'Ever wondered how your kitty came to be? Place a kitty id in the box to find out...'}</p>
			<Search
				{...{ kittyID }}
				onChange={e => setKittyID(e.target.value)}
				onSubmit={id => navigate(`/kitty/${id}`)}
				disabled={parseInt(kittyID) > total || kittyID === ''}
				max={parseInt(total)}
			/>
			<h4>{'🙀 Update!'} {'Kitty.Family now has a chat room - you just need to own at least one kitty to participate 🙀'}</h4>
			<h2>Featured Kitties</h2>
			<FeaturedKitties />
			<img src={'/images/kitty-hats/logo.png'} alt={'Kitty Hats'} />
			<h2>Kitty Hats</h2>
            <p>OMG... Kitty Hats is back. Originally released early 2018 this is a community driven project that lets you add hats to your cryptokitties</p>
			<KittyHats 
                hats={featuredHats}
				{...{ loggedIn, searchables, web3, handleSignIn }}
				handlePurchase={handleHatPurchase}
				handlePurchaseAndApply={handleHatPurchaseAndApply}
			/>
            <h3><Link to={'/kitty-hats'}>See more Kitty Hats</Link></h3>
		</Styled.Main>
	)
}

export default Homepage
