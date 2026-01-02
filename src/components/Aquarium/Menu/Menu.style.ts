import styled from 'styled-components'

export const Div = styled.div`
    position: absolute;
    left: 20px;
    bottom: 20px;
    display: flex;
    align-items: center;
    > div {
        &:nth-of-type(1) {
            width: 19px;
            margin-top: 1px;
            margin-right: 10px;
            > p {
                margin-top: 43px; 
            }
        }
        &:nth-of-type(2) {
            width: 20px;
            margin-top: 1px;
            margin-right: 2px;
            > p {
                margin-top: 42px; 
            }
        }
        &:nth-of-type(3) {
            width: 38px;
            margin-right: 2px;
            margin-top: -2px;
            > p {
                margin-top: 46px; 
            }
        }
        &:nth-of-type(4) {
            width: 18px;
            margin-top: 1px;
            margin-right: 9px;
            > p {
                margin-top: 42px; 
            }
        }
        &:nth-of-type(5) {
            width: 22px;
            margin-top: 2px;
            margin-right: 12px;
            > p {
                margin-top: 40px; 
            }
        }
        &:nth-of-type(6) {
            width: 18px;
            margin-top: 2px;
            opacity: 0.2;
            > p {
                margin-top: 40px; 
            }
        }
        aspect-ratio: 1/1;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        opacity: 0.5;
        > p {
            display: none;
            position: absolute;
            font-size: 10px;
            color: #CCC;
        }
        cursor: pointer;
        &:hover {
            opacity: .8;
            > p {
                display: block; 
            }
        }
        > img {
            width: 100%;
        }
    }
`