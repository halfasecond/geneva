import { breaks, gutters, headingSize, fontSize } from 'style/config'
import styled from 'styled-components'

export const Div = styled.div`
    position: fixed;
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 1;
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