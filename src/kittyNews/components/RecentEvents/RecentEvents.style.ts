import styled from 'styled-components'
import * as Styled from 'kittyNews/style'
import { breaks, gutters } from 'kittyNews/style/config'

export const Section = styled(Styled.Section)`
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    margin-bottom: ${gutters['xl']};
    > h2 {
        margin-bottom: ${gutters['xlg']};
    }
    > div.kitty-pfp {
        margin-bottom: ${gutters['lg']};
        width: 23.5%;
        @media (min-width: ${breaks['sm']}) {
            width: 18%;
        }
        @media (min-width: ${breaks['md']}) {
            width: 9.25%;
        }
    }
`