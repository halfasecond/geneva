import { useEffect, useState } from 'react'
import axios from 'axios'
import Kitty from 'kittyInternational/components/Kitty'
import { API, CK_API } from 'kittyInternational/api'
import { KittyRecord } from 'kittyInternational/types/kitty'
import * as Styled from './Home.style'

const IDS = [597907, 451586, 1077959, 534729, 130779, 198045, 310194, 350589, 407629, 419598, 527666, 575892, 1317098, 372743, 464805, 387863, 391473, 1075019, 470129, 485548]

const mergeKitties = (local: KittyRecord[], official: KittyRecord[]) =>
    local.map((kitty) => ({
        ...official.find((ck) => ck.id === kitty.tokenId),
        ...kitty,
    }))

const Home = ({ handlePurchase }: {
    handlePurchase: (tokenId: number, price: string, sale: boolean) => Promise<boolean>
}) => {
    const [results, setResults] = useState<KittyRecord[] | undefined>(undefined)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const query = `${API}/cryptokitties/nfts?include=sale,sire,other&search=id:${IDS.join(',')}`
                const { data: { kitties } } = await axios.get<{ kitties: KittyRecord[] }>(query)
                const ids = kitties.map(({ tokenId }) => tokenId).join(',')
                const { data: { kitties: ckData } } = await axios.get<{ kitties: KittyRecord[] }>(
                    `${CK_API}/kitties?search=id:${ids}&limit=20`,
                )
                const merged = mergeKitties(kitties, ckData).sort((a, b) =>
                    IDS.indexOf(a.tokenId) - IDS.indexOf(b.tokenId),
                )
                setResults(merged)
            } catch (error) {
                console.error(error)
            }
        }
        fetchData()
    }, [])

    const toFamily = (tokenId: number) => {
        window.location.href = `https://kitty.family/kitty/${tokenId}`
    }

    return (
        <Styled.Div>
            <h2>Kitties with Kitty Hats</h2>
            <Styled.Grid>
                {results && results.map((kitty, i) => i <= 4 && (
                    <Styled.Container key={kitty.tokenId}>
                        <Kitty {...{ kitty, handlePurchase }} showMewts showInfo={false} getInfo={toFamily} />
                    </Styled.Container>
                ))}
            </Styled.Grid>

            <h2>OG Hotrods</h2>
            <Styled.Grid>
                {results && results.map((kitty, i) => i >= 15 && (
                    <Styled.Container key={kitty.tokenId}>
                        <Kitty {...{ kitty, handlePurchase }} showInfo={false} showMewts showName getInfo={toFamily} />
                    </Styled.Container>
                ))}
            </Styled.Grid>

            <h2>Private Collection...</h2>
            <Styled.Grid>
                {results && results.map((kitty, i) => i >= 5 && i < 15 && (
                    <Styled.Container key={kitty.tokenId}>
                        <Kitty {...{ kitty, handlePurchase }} showInfo={false} showMewts showName getInfo={toFamily} />
                    </Styled.Container>
                ))}
            </Styled.Grid>
            <img src={'https://img.cryptokitties.co/0x06012c8cf97bead5deae237070f9587f8e7a266d/124.png'} alt={'CryptoKitty #124 - Furlin'} />
            <p>For all enquiries please contact: <a href="mailto:kitties@kitty.international">kitties@kitty.international</a></p>
        </Styled.Div>
    )
}

export default Home
