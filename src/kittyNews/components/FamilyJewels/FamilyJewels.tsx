import React from "react"
import * as Styled from "./FamilyJewels.style"

interface Props {
    enhanced_cattributes: any
    displayType: 'mewtations' | 'family-jewels'
    tokenId: number   
}

const Jewels: React.FC<Props> = ({ enhanced_cattributes, displayType, tokenId }) => {
    const gems: any[] = []
    enhanced_cattributes.map((c: any, i: number) => {
        if (displayType === "mewtations") {
            c.position === 1  && c.kittyId === tokenId && gems.push(<Styled.Diamond key={i} trait={c.description} {...{ displayType }} />)
            c.position >= 2 && c.position <= 10  && c.kittyId === tokenId && gems.push(<Styled.Jewel key={i} className={'gilded'} trait={c.description} {...{ displayType }} />)
            c.position >= 11 && c.position <= 100  && c.kittyId === tokenId && gems.push(<Styled.Jewel key={i} className={'amethyst'} trait={c.description} {...{ displayType }} />)
            c.position >= 101 && c.position <= 500 && c.kittyId === tokenId && gems.push(<Styled.Jewel key={i} className={'lapis'} trait={c.description} {...{ displayType }} />)
        } else { // displayType === "family-jewels"
            c.position === 1  && c.kittyId !== tokenId && gems.push(<Styled.Jewel key={i} className={'diamond'} trait={c.description} {...{ displayType }} />)
            c.position >= 2 && c.position <= 10  && c.kittyId !== tokenId && gems.push(<Styled.Jewel key={i} className={'gilded'} trait={c.description} {...{ displayType }} />)
            c.position >= 11 && c.position <= 100  && c.kittyId !== tokenId && gems.push(<Styled.Jewel key={i} className={'amethyst'} trait={c.description} {...{ displayType }} />)
            c.position >= 101 && c.position <= 500 && c.kittyId !== tokenId && gems.push(<Styled.Jewel key={i} className={'lapis'} trait={c.description} {...{ displayType }} />)
        }
    })
    return (
        <Styled.Div className={displayType}>
            {gems.map(gem => gem)}
        </Styled.Div>
    )
}

export default Jewels