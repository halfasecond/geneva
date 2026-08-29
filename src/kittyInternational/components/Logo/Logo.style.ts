import styled from 'styled-components'
import { breaks, fontSize, gutters } from 'kittyInternational/style/config'

export const Header = styled.header`
  width: 100%;
  max-width: 1100px;
  padding-top: 40px;
  margin: 0 auto;
  img {
    width: 50px;
  }
  > h1 {
    margin-bottom: ${gutters['sm']};
    font-size: ${fontSize.md};
    @media (min-width: ${breaks['md']}) {
        font-size: 48px;
        margin-bottom: ${gutters['md']};
    }
  }
  > p {
    font-family: "funkydori", sans-serif;
    font-size: 28px;
    @media (min-width: ${breaks['md']}) {
        font-size: 42px;
    }
    color: #333;
    margin-bottom: ${gutters['lg']};
  }
`
