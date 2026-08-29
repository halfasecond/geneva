import styled, { keyframes } from 'styled-components'

export const Div = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000000000000;
    overflow: hidden;
    width: 100%;
    height: 100%;
    pointer-events: none;
`

const burst = keyframes`
    0% { transform: translate(0, 0) scale(1); opacity: 1; }
    100% { transform: translate(var(--dx), var(--dy)) scale(0.2); opacity: 0; }
`

export const Speck = styled.span<{ $color: string; $dx: string; $dy: string; $delay: string }>`
    position: absolute;
    top: 50%;
    left: 50%;
    width: 10px;
    height: 10px;
    border-radius: 2px;
    background: ${p => p.$color};
    --dx: ${p => p.$dx};
    --dy: ${p => p.$dy};
    animation: ${burst} 1.6s ease-out ${p => p.$delay} forwards;
`
