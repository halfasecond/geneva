import styled from 'styled-components'

export const Main = styled.main`
    width: 100%;
    z-index: 1;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    > div {
        width: 100%;
        display: flex;
        > img {
            width: 50%;
            height: auto; 
        } 
    }
    > p > b {
        font-weight: bold;
    }
`


export const VideoBackground = styled.video`
    width: 100%;
    height: auto;
    object-fit: contain;
`
