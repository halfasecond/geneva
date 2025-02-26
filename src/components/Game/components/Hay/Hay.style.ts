import styled from 'styled-components'
import { Z_LAYERS } from "src/config/zIndex"

export const Div = styled.div`
    position: fixed;
    z-index: ${Z_LAYERS['UI']};
    background-color: #FFF;
    padding: 8px 12px;
    border-radius: 2px;
    top: 20px;
    left: 20px;
    font-weight: bold;
    box-shadow: 2px 2px 2px 1px rgba(0, 0, 255, .2);
`