import styled from 'styled-components'

export const Div = styled.div`
    height: 100vh;
    width: 100%;
    position: relative;
    color: #eef;
    font-family: system-ui;
    background-color: rgba(0,0,15,1);
    > canvas {
        width: 100%;
        height: 100vh;
        display: block; 
    }

    > img {
        position: absolute;
        top: 26px;
        right: 26px;
        cursor: pointer;
        z-index: 1000; 
    }
`

export const Button = styled.button`
    width: 100%;
    padding: 0.45rem;
    background: #3a8fff;
    border: none;
    color: #fff;
    border-radius: 6px;
    margin-top: 18px;
    cursor: pointer;
    &:disabled {
        opacity: 0.5;
`