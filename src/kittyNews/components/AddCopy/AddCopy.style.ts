import styled from 'styled-components'
import { gutters } from 'kittyNews/style/config'

export const Div = styled.div`
    > h2 {
        margin-bottom: ${gutters['xl']};
    }
    padding: ${gutters['lg']};
    background-color: #FFF;
    width: 800px;
    border-radius: ${gutters['sm']};
`