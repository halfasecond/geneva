// @ts-nocheck
import styled from 'styled-components'
import { gutters } from 'kittyFamily/style/config'

export const Div = styled.div`
  font-size: 10px;
  box-sizing: border-box;
  top: 16px;
  left: 12px;
  background-color: #FFF;
  border-radius: 5px;
  margin: 0 0 ${gutters['lg']};
  > div {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-evenly;
    padding-top: 8px;
    border-radius: 5px;
    padding: 10px 2%;
    b {
      font-size: 12px;
      font-weight: bold;
      margin: 3px 0;
      display: block;
      overflow: hidden;
      width: 100%;
    }
    > div {
      width: 45%;
      margin: 4px 0 10px;
      > div {
        display: flex;
        margin-top: 4px;
        font-weight: bold;
        text-transform: uppercase;
        font-size: 12px;
        > div {
          width: 25%;
        }
      }
    }
  }
`
