// @ts-nocheck
import styled from 'styled-components'
import { breaks } from 'kittyFamily/style/config'

export const Div = styled.div`
  display: flex;
  margin: 0 auto;
  width: 94%;
  positon: relative;
  justify-content: space-between;
  > div {
    width: 31%;
    @media (min-width: ${breaks['xlg']}) {
      width: 18.5%;
    }
    &:nth-of-type(4), :nth-of-type(5) {
      display: none;
      @media (min-width: ${breaks['xlg']}) {
        display: block;
      }
    }
    padding-top: 0;
    cursor: pointer;
    &:hover {
      opacity: 0.95;
    }
    img {
      width: 100%;
    }
  }
`
