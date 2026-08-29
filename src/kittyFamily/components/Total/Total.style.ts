// @ts-nocheck
import styled from 'styled-components'

export const Div = styled.div`
  display: none;
  @media (min-width: 700px) {
    display: block;
  }
  position: fixed;
  background-color: #FFF;
  padding: 0 20px;
  box-sizing: border-box;
  border-radius: 10px;
  top: 20px;
  right: 20px;
  text-align: right;
  font-size: 14px !important;
  cursor: default;
  vertical-align: baseline;
  z-index: 100;
  img {
    width: 16px;
    margin: 0 16px -4px 16px;
  }
  span {
    cursor: pointer;
    color: #333;
  }
`
