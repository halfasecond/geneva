import styled from 'styled-components'
import { fontSize, gutters } from 'kittyInternational/style/config'

export const Div = styled.div`
  position: fixed;
  z-index: 100001;
  bottom: ${gutters['md']};
  left: ${gutters['md']};
  > button {
    background-color: #EEE;
    border: 1px solid #666;
    padding: ${gutters['xs']} ${gutters['sm']};
    display: flex;
    align-items: center;
    border-radius: ${gutters['xs']};
    font-size: ${fontSize['sm']};
    font-weight: bold;
    > img, svg {
        margin-right: ${gutters['sm']};
        width: 30px;
        height: 30px;
    }
  }
`
