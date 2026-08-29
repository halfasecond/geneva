import styled from 'styled-components'

export const Div = styled.div`
  display: none;
  @media (min-width: 650px) {
    display: block;
  }
  position: fixed;
  background-color: #FFF;
  line-height: 24px;
  box-sizing: border-box;
  border-radius: 10px;
  margin-top: 19px;
  left: 20px;
  text-align: right;
  cursor: default;
  vertical-align: baseline;
  border: 1px solid #EEE;
  top: 0;
  font-size: 12px;
  padding: 0 12px;
  z-index: 101;
  font-weight: bold;
  @media (min-width: 800px) {
    padding: 0 20px;
  }
  span {
    color: #333;
  }
  img {
    width: 16px;
    margin: 0 16px -4px 16px;
  }
`
