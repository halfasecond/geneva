import { grey, gutters } from 'kittyNews/style/config'
import styled from 'styled-components'

export const Div = styled.div`
    width: 100%;
    .slick-slider {
        .slick-slide {
            > div {
                padding: 0 ${gutters['sm']};
                margin-bottom: ${gutters['lg']};
                box-sizing: border-box;
                > * > div {
                    width 100%;
                    aspect-ratio: 16/9;
                    border-radius: 4px;
                    border: 2px solid ${grey['400']};
                    margin-bottom: ${gutters['xmd']};
                    background-size: cover;
                    background-position: center;
                }
            }
        }
    }
`