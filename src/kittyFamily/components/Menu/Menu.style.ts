// @ts-nocheck
import styled from 'styled-components'
import { gutters } from 'kittyFamily/style/config'

export const Div = styled.div`
  position: fixed;
  z-index: 1000000;
  top: 12px;
  left: 12px;
  display: flex;
  background-color: #FFF;
  padding: 2px;
  border-radius: 5px;
  padding: ${gutters['xxs']} ${gutters['sm']};
  > div {
      height: 30px;
      border-radius: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      &:hover {
        > * { opacity: 0.9; }
      }
      > img, > svg, > a > img, > a > svg {
        width: 26px;
        height: 26px;
      }
      > a > img {
        border-radius: 4px;
      }
      margin-right: ${gutters['sm']};
      &:last-of-type {
        margin-right: 0;
      }
    }
  }
`
