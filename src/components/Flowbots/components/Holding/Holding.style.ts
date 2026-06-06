import styled from 'styled-components'
import * as Styled from '../../style'

export const Div = styled(Styled.Div)`
    > h1 {
        padding: 0 0 48px;
        + p {
            margin-bottom: 72px;
        }
    }

    > img {
        max-width: 240px;
        border-radius: 8px;
        margin-bottom: 96px;
        box-shadow: 10px 10px 30px rgba(77,173,212,0.25);
    }

    > h2 {
        margin-bottom: 24px;
    }

    > blockquote {
        margin-bottom: 64px;
        padding: 24px 36px;
        max-width: 580px;
    }

    > p {
        font-weight: bold;
        line-height: 24px;
        text-align: center;
        margin-bottom: 24px;
    }

    padding-bottom: 0;

    > h3 {
        margin-bottom: 24px;
        font-size: 18px;
    }

    > * {
        &:last-child {
            margin-bottom: 72px;
        }
    }
    
    > h2.flowbots-floor {
        margin: 96px auto 24px;
    }
`

export const Form = styled.form`
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    > div {
        display: flex;
        margin-bottom: 48px;
        > input {
            font-family: monospace;
            color: #333;
            font-size: 36px;
            padding: 16px;
            width: 72px;
            display: flex;
            justify-content: center;
            margin-right: 24px;
            outline: 0;
            border: 2px solid #EEE;
            border-radius: 6px;
            &:last-of-type {
                margin-right: 0;
            }
        }
    }
    > input {
        font-family: monospace;
        color: #333;
        font-size: 24px;
        padding: 16px;
        border: 2px solid #999;
        border-radius: 6px;
        &:disabled {
            opacity: 0.4;
        }
    }
    
`

export const Button = styled.button`
    font-family: monospace;
    font-weight: bold;
    background-color: #FFF;
    color: #333;
    font-size: 18px;
    padding: 16px;
    border: 2px solid #999;
    border-radius: 6px;
    &:disabled {
        opacity: 0.4;
    }
`

export const Grid = styled(Styled.Grid)`
    width: 100%;
    margin-bottom: 56px;
    justify-content: center;
    max-width: 320px;
    > div {
        display: block;
        box-shadow: 10px 10px 30px rgba(77,173,212,0.25);
        margin-bottom: 18px;
        overflow: hidden;
        border-radius: 12px;
        background-color: ${Styled.colors.blue};
        border: 1px solid #666;
        > img {
            width: 100%; 
        }
    }
`

/* transform-style: preserve-3d;
transform-origin: center;
transition: transform 1s;
backface-visibility: hidden;
&:hover {
    transform: rotateY(180deg);
}*/
