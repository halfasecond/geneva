// @ts-nocheck
import React from "react";
import * as Styled from "./Jewels.style"

const Jewels = ({ kitty, displayType }) => {
  const gems = []
  const id = kitty.id || kitty.tokenId
  const traits = kitty.enhanced_cattributes || kitty.cattributes || []
  traits.map((c, i) => {
    if (displayType === "mewtations") {
      c.position === 1  && c.kittyId === id && gems.push(<Styled.Jewel key={i} type={'diamond'} trait={c.description} {...{ displayType }} />)
      c.position >= 2 && c.position <= 10  && c.kittyId === id && gems.push(<Styled.Jewel key={i} type={'gilded'} trait={c.description} {...{ displayType }} />)
      c.position >= 11 && c.position <= 100  && c.kittyId === id && gems.push(<Styled.Jewel key={i} type={'amethyst'} trait={c.description} {...{ displayType }} />)
      c.position >= 101 && c.position <= 500 && c.kittyId === id && gems.push(<Styled.Jewel key={i} type={'lapis'} trait={c.description} {...{ displayType }} />)
    } else { // displayType === "family-jewels"
      c.position === 1  && c.kittyId !== id && gems.push(<Styled.Jewel key={i} type={'diamond'} trait={c.description} {...{ displayType }} />)
      c.position >= 2 && c.position <= 10  && c.kittyId !== id && gems.push(<Styled.Jewel key={i} type={'gilded'} trait={c.description} {...{ displayType }} />)
      c.position >= 11 && c.position <= 100  && c.kittyId !== id && gems.push(<Styled.Jewel key={i} type={'amethyst'} trait={c.description} {...{ displayType }} />)
      c.position >= 101 && c.position <= 500 && c.kittyId !== id && gems.push(<Styled.Jewel key={i} type={'lapis'} trait={c.description} {...{ displayType }} />)
    }
  })
  return (
    <Styled.Div className={displayType}>
      {gems.length > 0
        ? gems.map(gem => gem)
        : <Styled.Jewel type={'none'} />
      }
    </Styled.Div>
  )
}

export default Jewels
