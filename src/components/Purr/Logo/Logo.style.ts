import { breaks, gutters, headingSize, fontSize } from 'style/config'
import styled from 'styled-components'

export const Div = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin-bottom: ${gutters['xxl']};
    > h1 {
        font-size: ${headingSize['lg']};
        @media (min-width: ${breaks['md']}) {
            font-size: ${headingSize['xl']};
        }
        text-shadow: 2px 2px 3px rgba(255,255,255,0.4);
        margin-bottom: ${gutters['xl']};
    }

    > h2 {
        text-shadow: 2px 2px 3px rgba(255,255,255,0.4);
        font-size: ${fontSize['xmd']};
    }

`