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
    > a {
        display: block;
        box-shadow: 10px 10px 30px rgba(77,173,212,0.25);
        margin-bottom: 18px;
        overflow: hidden;
        border-radius: 12px;
        background-color: ${Styled.colors.blue};
        border: 1px solid #666;
        > div {
            &:first-of-type {
                &:after {
                    content: "";
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    border: 6px solid ${Styled.colors.blue};
                    border-radius: 4px;
                    pointer-events: none;
                }
            }
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

export const Search = styled.div`
    width: 100%;
    display: flex;
    justify-content: center;
    margin: 24px 0 32px;
    > div {
        display: flex;
        background-color: #F6F6F6;
        padding: 12px 18px;
        border-radius: 4px;
        position: relative;
        border: 2px dotted rgba(77,173,212,1);
        margin-right: 36px;
        &:last-of-type {
            margin-right: 0;
        }
        > label {
            display: flex;
            align-items: center;
            margin-left: 32px;
            &:first-of-type {
                margin-left: 0;
            }
            > img {
                width: 20px;
                margin-right: 4px;
            }
            > span {
                display: block;
                margin-right: 4px; 
            }
        }
        
    }
    
`