import styled from 'styled-components'

export const Main = styled.main`
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background: #f0f0f0;

    > h1 {
        position: fixed;
        bottom: 18px;
        right: 24px;
        z-index: 100;
        margin: 0;
        padding: 12px;
        border-radius: 4px;
        pointer-events: none;
    }
`
