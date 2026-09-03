import React from "react"
import * as Styled from "./FamilyJewels.style"

interface Props {
    enhanced_cattributes: any
    displayType: 'mewtations' | 'family-jewels'
    tokenId: number
    overlay?: boolean
}

const Jewels: React.FC<Props> = ({ enhanced_cattributes, displayType, tokenId, overlay }) => {
    const gems: any[] = []
    const id = Number(tokenId)
    if (!Array.isArray(enhanced_cattributes) || !enhanced_cattributes.length) return null
    enhanced_cattributes.forEach((c: any, i: number) => {
        const origin = Number(c.kittyId)
        if (displayType === "mewtations") {
            c.position === 1  && origin === id && gems.push(<Styled.Diamond key={i} trait={c.description} {...{ displayType }} />)
            c.position >= 2 && c.position <= 10  && origin === id && gems.push(<Styled.Jewel key={i} className={'gilded'} trait={c.description} {...{ displayType }} />)
            c.position >= 11 && c.position <= 100  && origin === id && gems.push(<Styled.Jewel key={i} className={'amethyst'} trait={c.description} {...{ displayType }} />)
            c.position >= 101 && c.position <= 500 && origin === id && gems.push(<Styled.Jewel key={i} className={'lapis'} trait={c.description} {...{ displayType }} />)
        } else {
            origin !== id && c.position === 1 && gems.push(<Styled.Jewel key={i} className={'diamond'} trait={c.description} {...{ displayType }} />)
            origin !== id && c.position >= 2 && c.position <= 10 && gems.push(<Styled.Jewel key={i} className={'gilded'} trait={c.description} {...{ displayType }} />)
            origin !== id && c.position >= 11 && c.position <= 100 && gems.push(<Styled.Jewel key={i} className={'amethyst'} trait={c.description} {...{ displayType }} />)
            origin !== id && c.position >= 101 && c.position <= 500 && gems.push(<Styled.Jewel key={i} className={'lapis'} trait={c.description} {...{ displayType }} />)
        }
    })
    if (!gems.length) return null
    return (
        <Styled.Div className={`${displayType}${overlay ? ' overlay' : ''}`}>
            {gems}
        </Styled.Div>
    )
}

export default Jewels