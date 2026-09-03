// @ts-nocheck
import styled from 'styled-components'
import { breaks, gutters } from 'kittyFamily/style/config'

export const Div = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: flex-start;
  margin: 0 auto;
  width: 94%;
  position: relative;
  box-sizing: border-box;
  > div {
    width: 48%;
    margin: 0 4% ${gutters['md']} 0;
    min-width: 0;
    box-sizing: border-box;
    padding-top: 0;
    cursor: pointer;
    &:nth-of-type(2n) {
      margin-right: 0;
    }
    @media (min-width: ${breaks['md']}) {
      width: 31%;
      margin-right: 3.5%;
      &:nth-of-type(2n) {
        margin-right: 3.5%;
      }
      &:nth-of-type(3n) {
        margin-right: 0;
      }
    }
    @media (min-width: ${breaks['xlg']}) {
      width: 18.5%;
      margin-right: 1.875%;
      &:nth-of-type(2n),
      &:nth-of-type(3n) {
        margin-right: 1.875%;
      }
      &:nth-of-type(5n) {
        margin-right: 0;
      }
    }
    &:nth-of-type(4),
    &:nth-of-type(5) {
      display: none;
      @media (min-width: ${breaks['xlg']}) {
        display: block;
      }
    }
    &:hover {
      opacity: 0.95;
    }
  }
`
