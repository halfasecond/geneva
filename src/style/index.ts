import styled from 'styled-components'
import { Z_LAYERS } from 'src/config/zIndex'

export const Main = styled.main`
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background: #f0f0f0;

    > h1 {
        position: fixed;
        bottom: 50px;
        right: 24px;
        z-index: ${Z_LAYERS['UI']};
        margin: 0;
        padding: 12px;
        border-radius: 4px;
        pointer-events: none;
        color: #000000;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    }
`
