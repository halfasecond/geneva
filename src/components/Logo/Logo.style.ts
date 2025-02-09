import { breaks, gutters, fontSize } from 'style/config'
import styled from 'styled-components'

export const Div = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 0 2.5% ${gutters['lg']};
    padding-top: ${gutters['lg']};
    > h1 {
        margin-bottom: ${gutters['sm']};
        margin-top: -12px;
        font-size: ${fontSize['xl']};
        @media (min-width: ${breaks['md']}) {
            font-size: ${fontSize['xxl']};
            margin-bottom: ${gutters['md']};
            margin-top: 0;
        }
    }

    > a > img {
        width: 72px;
        @media (min-width: ${breaks['md']}) {
            width: 110px;
        }
    }

    > h2 {
        margin-bottom: ${gutters['md']};
        &:first-of-type {
            margin-bottom: ${gutters['md']};
        }
        font-size: ${fontSize['xs']};
        @media (min-width: ${breaks['md']}) {
            font-size: ${fontSize['xmd']};
            &:first-of-type {
                margin-bottom: ${gutters['xlg']};
            }
        }
    }

`