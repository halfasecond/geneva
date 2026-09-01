import * as Styled from './Homepage.style'
import { useEffect, useState } from 'react'
import { Copy } from 'kittyNews/types/copy'
import axios from 'axios'
import { Contract } from 'web3-eth-contract'
import { AbiFragment } from 'web3'
import Floor from 'kittyNews/components/Floor'
import Gens from 'kittyNews/components/Gens'
import Headline from 'kittyNews/components/Headline'
import Carousel from 'kittyNews/components/Carousel'
import PurrClaim from 'kittyNews/components/PurrClaim'
import RecentEvents from 'kittyNews/components/RecentEvents'
// import Volume from 'kittyNews/components/Volume'
import Report from 'kittyNews/components/Report'
import ZenCalculator from 'kittyNews/components/ZenCalculator'
import { ReportType } from 'kittyNews/types/report'
import { settings } from './config'

const headline = 'purr-new-erc20-by-kitty-international'
const allthezen = 'all-the-zen-telegram-game-release'

interface Props {
    report: ReportType | undefined
    floor: ReportType | undefined
    births: ReportType | undefined
    transfers: ReportType | undefined
    endpoint: string,
    walletAddress: string | undefined,
    claims: ReportType | undefined,
    cryptokitties: Contract<AbiFragment[]>,
    purrClaim: Contract<AbiFragment[]>,
    purrBalance: string | undefined,
    purrClaimBalance: string | undefined,
    updateBalances: () => void,
    handleSignIn: () => void,
}

const Homepage: React.FC<Props> = ({ walletAddress, cryptokitties, purrClaim, purrClaimBalance, claims, report, floor, births, transfers, endpoint }) => {
    const [copy, setCopy] = useState<Copy[] | undefined>(undefined)

    useEffect(() => {
        const getCopy = async () => {
            try {
                const { data } = await axios.get(`${endpoint}`)
                setCopy(data)
            } catch (e) {
                console.error(e)
            }
        }
        
        getCopy()
    }, [])

    return (
        <>
            <Styled.Section>
                {floor && <Floor { ...{ floor }} />}
                {report && <Report {...{ report }} />}
            </Styled.Section>
            
            {/* {ethPrices && volumeData && <Volume data={[volumeData]} {...{ ethPrices }} />} */}
            <Styled.Section_2Column>
                {copy && copy.filter(c => c.slug === headline && c.published) && (
                    <Headline copy={copy.filter(c => c.slug === headline)[0]} headlineImage={'erc20-purr-launches.jpg'} />
                )}
                <PurrClaim {...{ walletAddress, purrClaimBalance, purrClaim, cryptokitties }} />
            </Styled.Section_2Column>
            <Styled.Section>
                <h2>All Kitties - {report && report.Birth}</h2>
                {report && <Gens { ...{ report }} />}
            </Styled.Section>
            {copy && (
                <Styled.Section>
                    <h2>Recent News</h2>
                    <Carousel 
                        data={copy.filter(({ contentType, slug }) => contentType === 'news' && !(slug === headline) )}
                        settings={settings.news}
                    />
                </Styled.Section>
            )}
            {transfers && (
                <RecentEvents events={transfers} eventType='Transfer' />
            )}
            {copy && (
                <Styled.Section>
                    <h2>Articles</h2>
                    <Carousel 
                        data={copy.filter(({ contentType }) => contentType === 'article')}
                        settings={settings.articles}
                    />
                </Styled.Section>
            )}
            {births && (
                <RecentEvents events={births} eventType='Birth' />
            )}
            {claims && (
                <RecentEvents events={claims} eventType='PurrClaim' />
            )}
            <Styled.Section_2Column>
                {copy && copy.filter(c => c.slug === allthezen && c.published) && (
                    <Headline copy={copy.filter(c => c.slug === allthezen)[0]} headlineImage={'all-the-zen.png'} />
                )}
                <ZenCalculator />
            </Styled.Section_2Column>
        </>
    )
}

export default Homepage