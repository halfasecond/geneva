// @ts-nocheck
import React from "react";
import * as Styled from "./Jewels.style"

const Jewels = ({ kitty, displayType, hideEmpty }) => {
  const gems = []
  const id = Number(kitty.id ?? kitty.tokenId)
  const traits = kitty.enhanced_cattributes || kitty.cattributes || []
  traits.map((c, i) => {
    const origin = Number(c.kittyId)
    if (displayType === "mewtations") {
      c.position === 1  && origin === id && gems.push(<Styled.Jewel key={i} type={'diamond'} trait={c.description} {...{ displayType }} />)
      c.position >= 2 && c.position <= 10  && origin === id && gems.push(<Styled.Jewel key={i} type={'gilded'} trait={c.description} {...{ displayType }} />)
      c.position >= 11 && c.position <= 100  && origin === id && gems.push(<Styled.Jewel key={i} type={'amethyst'} trait={c.description} {...{ displayType }} />)
      c.position >= 101 && c.position <= 500 && origin === id && gems.push(<Styled.Jewel key={i} type={'lapis'} trait={c.description} {...{ displayType }} />)
    } else { // displayType === "family-jewels"
      origin !== id && c.position === 1 && gems.push(<Styled.Jewel key={i} type={'diamond'} trait={c.description} {...{ displayType }} />)
      origin !== id && c.position >= 2 && c.position <= 10 && gems.push(<Styled.Jewel key={i} type={'gilded'} trait={c.description} {...{ displayType }} />)
      origin !== id && c.position >= 11 && c.position <= 100 && gems.push(<Styled.Jewel key={i} type={'amethyst'} trait={c.description} {...{ displayType }} />)
      origin !== id && c.position >= 101 && c.position <= 500 && gems.push(<Styled.Jewel key={i} type={'lapis'} trait={c.description} {...{ displayType }} />)
    }
  })
  if (hideEmpty && gems.length === 0) return null
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
