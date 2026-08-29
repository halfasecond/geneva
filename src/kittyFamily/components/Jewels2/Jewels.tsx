// @ts-nocheck
import React from "react";
import * as Styled from "./Jewels.style"

const Jewels = ({ kitty, displayType }) => {
  const gems = []
  kitty.enhanced_cattributes.map((c, i) => {
    if (displayType === "mewtations") {
      c.position === 1  && c.kittyId === kitty.id && gems.push(<Styled.Jewel key={i} type={'diamond'} trait={c.description} {...{ displayType }} />)
      c.position >= 2 && c.position <= 10  && c.kittyId === kitty.id && gems.push(<Styled.Jewel key={i} type={'gilded'} trait={c.description} {...{ displayType }} />)
      c.position >= 11 && c.position <= 100  && c.kittyId === kitty.id && gems.push(<Styled.Jewel key={i} type={'amethyst'} trait={c.description} {...{ displayType }} />)
      c.position >= 101 && c.position <= 500 && c.kittyId === kitty.id && gems.push(<Styled.Jewel key={i} type={'lapis'} trait={c.description} {...{ displayType }} />)
    } else { // displayType === "family-jewels"
      c.position === 1  && c.kittyId !== kitty.id && gems.push(<Styled.Jewel key={i} type={'diamond'} trait={c.description} {...{ displayType }} />)
      c.position >= 2 && c.position <= 10  && c.kittyId !== kitty.id && gems.push(<Styled.Jewel key={i} type={'gilded'} trait={c.description} {...{ displayType }} />)
      c.position >= 11 && c.position <= 100  && c.kittyId !== kitty.id && gems.push(<Styled.Jewel key={i} type={'amethyst'} trait={c.description} {...{ displayType }} />)
      c.position >= 101 && c.position <= 500 && c.kittyId !== kitty.id && gems.push(<Styled.Jewel key={i} type={'lapis'} trait={c.description} {...{ displayType }} />)
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
