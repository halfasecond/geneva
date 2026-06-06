import styled from "styled-components"

export const Div = styled.div`
    position: fixed;
    z-index: 10000000000;
    width: 100%;
    height: 100vh;
    background-color: rgba(0,0,0,0.5);
    top: 0;
    padding: 2.5vh 8%;
    box-sizing: border-box;
    > div {
        width: 100%;
        height: 95vh;
        max-width: 780px;
        background-color: #FFF;
        border-radius: 12px;
        box-sizing: border-box;
        padding: 72px 48px;
        margin: 0 auto;
        overflow: auto;
    }
`