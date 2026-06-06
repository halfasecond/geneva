import styled from 'styled-components'
import * as Styled from '../../style'

export const Div = styled.div`
    display: flex;
    width: 100%;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    > h2 {
        margin-bottom: 48px;
    }
    > div {
        display: block;
        box-shadow: 10px 10px 30px rgba(77,173,212,0.25);
        border: 1px solid #666;
        margin-bottom: 72px;
        overflow: hidden;
        border-radius: 12px;
        background-color: ${Styled.colors.blue};
        
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

    > img {
        width: 90px;
        margin-top: 64px; 
    }
`

export const Form = styled.form`
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    > div {
        display: flex;
        margin-bottom: 24px;
        align-items: center;

        &:last-of-type {
            margin-top: 24px;
        }

        > div {
            display: flex;
            flex-direction: column;
            align-items:center;
            margin-right: 36px;
            &:last-of-type {
                margin-right: 0;
            }
            > label {
                display: block;
                font-family: monospace;
                font-weight: bold;
                margin-bottom: 12px;
            }
            > input[type='text'] {
                font-family: monospace;
                color: #333;
                font-size: 18px;
                padding: 12px;
                width: 120px;
                text-align: center;
                margin-right: 24px;
                outline: 0;
                border: 2px solid #EEE;
                border-radius: 6px;
                &:last-of-type {
                    margin-right: 0;
                }
                &:disabled {
                    opacity: 0.4;
                }
            }
        }
        
        > input[type='submit'] {
            font-family: monospace;
            font-weight: bold;
            background-color: #FFF;
            color: #333;
            font-size: 14px;
            padding: 12px;
            border: 2px solid #999;
            border-radius: 6px;
            &:disabled {
                opacity: 0.4;
            }
        }
    }
    > h3 {
        margin-bottom: 36px; 
    }

    > blockquote {
        &.information {
            max-width: 520px;
            width: 100%;
            margin-bottom: 36px;
        }
        background-color: #d6d6d6;
        font-family: monospace;
        padding: 12px 24px;
        border-radius: 4px;
        font-weight: bold;
        text-align: center;
        line-height: 24px;
        font-size: 14px;
        box-shadow: 10px 10px 30px rgba(0, 0, 0, 0.1);
        > a, > p > a {
            border-bottom: 2px dotted; 
        }
        > p {
            margin-bottom: 14px;
            &:first-of-type {
                padding-top: 14px;
            }
        }
    }

    > p {
        font-weight: bold;
        font-size: 14px;
        margin-bottom: 24px;
        font-family: monospace; 
    }
`