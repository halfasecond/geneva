import styled from 'styled-components'

export const Div = styled.div`
    position: fixed;
    width: 64px;
    @media (min-width: 620px) {
        width: 100px;
    }
    @media (min-width: 768px) {
        width: 120px;
    }

    @media (min-width: 1120px) {
        width: 140px;
    }
    @media (min-width: 1320px) {
        width: 160px;
    }
    opacity: 0.8;
    top: 20px;
    left: 20px;

    > img {
        width: 100%; 
    }
`