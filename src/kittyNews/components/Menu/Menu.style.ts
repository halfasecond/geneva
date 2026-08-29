import styled from 'styled-components'
import { gutters } from 'kittyNews/style/config'

export const Div = styled.div`
    position: fixed;
    top: ${gutters['lg']};
    right: ${gutters['lg']};
    z-index: 10000;
`