// @ts-nocheck
import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import Kitty from 'kittyFamily/components/Kitty'
import * as Styled from './FeaturedKitties.style'
import { API } from 'kittyFamily/api'

const FEATURED_KITTIES = [2023378,556041,540365,332858,407629]

const FeaturedKitties = () => {
    const navigate = useNavigate()
    const [kitties, setKitties] = useState(undefined)
    useEffect(() => {
        const fetchKitties = async () => {
            try {
                const ids = FEATURED_KITTIES.join(',')
                const query = `${API}/cryptokitties/nfts?search=id:${ids}`
                const { data: { kitties, total } } = await axios.get(query)
                const ckResult = await axios.get(`https://api.cryptokitties.co/v3/kitties?search=id:${ids}&limit=20`)
                const { data: { kitties: ckData } } = ckResult
                const _kitties = kitties.map(kitty => ({ ...ckData.find(ck => ck.id === kitty.tokenId), ...kitty }))
                // Sort the merged kitties based on the order in FEATURED_KITTIES
                const sortedKitties = _kitties.sort((a, b) => {
                    return FEATURED_KITTIES.indexOf(a.id.toString()) - FEATURED_KITTIES.indexOf(b.id.toString())
                })
                setKitties(sortedKitties)
            } catch (error) {
                console.error('Error fetching kitties:', error)
            }
        }
    
        fetchKitties()
    }, [])
    

    return (
        <Styled.Div>
            {kitties && kitties.map((kitty, i) => 
                <Kitty key={i} {...{ kitty }} showInfo={false} getInfo={() => navigate(`/kitty/${kitty.id}`)} bgColor={kitty.color} showMewts />
            )}
        </Styled.Div>
    )
}

export default FeaturedKitties
