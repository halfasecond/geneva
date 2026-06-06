import styled from 'styled-components'

export const Main = styled.main`
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 64px;
    background-color: #000;
    min-height: 100vh;
    box-sizing: border-box;

    > div {
        width: 600px;
        margin-bottom: 48px; 
    }
    
    > h1 {
        margin-bottom: 24px;
        color: #F6F6F6;
    }

    
`

export const Canvas = styled.div`
    aspect-ratio: 10/6;
    position: relative;
    background-color: #000;
    > img {
        position: absolute;
        width: 10px;
        height: 10px;
        aspect-ratio: 1/1;
        border: 1px dotted #FFF;
        &:first-of-type {
            width: 100%;
            height: auto;
            aspect-ratio: 10/6;
            border: none;
        }
    }
`

export const Modal = styled.div`
    width: 100%;
    padding: 64px 5%;
    box-sizing: border-box;
    min-height: 200px;
`

export const Tile = styled.div`
    width: 100%;
    > img {
        width: 100%; 
    }
    > h3 {
        font-family: monospace;
    }
`