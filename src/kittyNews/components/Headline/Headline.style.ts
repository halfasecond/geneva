import styled from 'styled-components'
import { breaks, colors, gutters, fontSize } from 'kittyNews/style/config'

export const Div = styled.div`
    > h1 {
        text-align: center;
        font-size: ${fontSize['md']};
        @media (min-width: ${breaks['lg']}) {
            font-size: ${fontSize['lg']};
            text-align: left;
        }
        @media (min-width: ${breaks['xl']}) {
            font-size: ${fontSize['xxxl']};
        }
        > img {
            width: 100%; 
        }
    }

    > img, video {
        width: 100%;
        border-radius: ${gutters['sm']};
        margin: 0 0 ${gutters['lg']} 0;
    }

    > p {
        > b {
            font-weight: bold; 
        }
        > a {
            color: ${colors.bubblegum}; 
        }
    }
`