import styled from 'styled-components'
import * as Styled from '../../style'

export const Div = styled(Styled.Div)`
    padding-top: 48px;
    > h2 {
        font-size: 40px;
        margin-bottom: 36px; 
    }

    > h3 {
        font-size: 18px;
        margin-bottom: 24px; 
    }

    > table {
        width: 100%;
        max-width: 680px;
        background-color: #FFF;
        border-radius: 6px;
        margin-bottom: 48px;
        box-shadow: 10px 10px 30px rgba(0, 0, 0, 0.05);
        thead {
            > tr {
                > td {
                    padding: 24px 24px 12px;
                    font-weight: bold;
                }
            }
        }
        tbody {
            > tr {
                &:first-of-type {
                    td {
                        border-top: 2px ${Styled.colors.blue} dotted;
                        padding-top: 24px;
                        > i {
                            display: block;
                            text-align: center;
                            font-style: italic;
                        }
                    }
                }
                &:last-of-type {
                    > td {
                        padding-bottom: 24px; 
                    }
                }
            }
        }
        td {
            padding: 6px 24px;
            font-family: monospace;
            font-weight: bold;
            &:nth-of-type(2), &:nth-of-type(3) {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 140px;
            }
        } 
    }

    > input {
        font-family: monospace;
        color: #333;
        font-size: 24px;
        padding: 16px;
        border: 2px solid #999;
        background-color: #EEE;
        font-weight: bold;
        border-radius: 6px;
        margin-bottom: 48px;
        &:disabled {
            opacity: 0.4;
        }
    }

    > ul {
        max-width: 580px;
        width: 100%;
        font-family: monospace;
        box-sizing: border-box;
        padding: 44px 12px 44px;
        border-radius: 4px;
        font-weight: bold;
        text-align: center;
        line-height: 28px;
        font-size: 18px;
        box-shadow: 10px 10px 30px rgba(0, 0, 0, 0.05);
        background-color: #FFF;
        display: flex;
        justify-content: space-around;
        margin-bottom: 48px;
        position: relative;
        &:after {
            content: "";
            position: absolute;
            top: 8px;
            bottom: 8px;
            left: 8px;
            right: 8px;
            border: 3px dotted rgba(77,173,212,1);
            pointer-events: none;
        }
        > div {
            display: flex;
            flex-direction: column;
            width: 320px;
            > li {
                margin-bottom: 18px;
                text-transform: uppercase;
                font-weight: bold;
                &:last-of-type {
                    margin-bottom: 0;
                }
                font-size: 12px;
                > span {
                    &:first-of-type {
                        color: ${Styled.colors.blue};
                        display: inline-block;
                        border-bottom: 2.5px dotted  ${Styled.colors.blue};
                        margin-bottom: 6px;
                    }
                    &:last-of-type {
                        display: block;
                        color: #333;
                        font-size: 14px;
                    }
                    
                } 
            }
        }
    }
    > .countdown {
        margin-bottom: 48px; 
    }
    > blockquote {
        &.information {
            max-width: 680px;
            width: 100%;
        }
        box-sizing: border-box;
        margin-bottom: 48px;
        display:flex;
        &.flex-column {
            flex-direction: column;
        }
        > h3 {
            padding-top: 18px;
            margin-bottom: 24px; 
        }
        > p {
         font-size: 14px;
            &:last-of-type {
                margin-bottom: 24px; 
            } 
        }
        > img {
            width: 28px;
            margin-right: 12px;
            margin-left: 48px;
            &:first-of-type {
                margin-left: 0;
            }
        }
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
        > input[type='text'] {
            font-family: monospace;
            color: #333;
            font-size: 24px;
            padding: 16px;
            width: 140px;
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
        > input[type='submit'] {
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
        }
    }
    
    
`

export const Banner = styled.div`
    width: 100%;
    background-color: ${Styled.colors.blue};
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 96px;
    box-sizing: border-box;
    position: relative;
    box-shadow: 0px 10px 30px rgba(77,173,212,0.25);
    border-top: 1px solid #666;
    border-bottom: 1px solid #666;
    user-select: none;
    > a {
        display: block;
        position: absolute;
        top: 50%;
        &.arrow-forward {
            right: 1%;
        } 
        &.arrow-back {
            left: 1%;
            transform: rotate(180deg);
        }
        > img {
            width: 32px; 
        }
    }
    > div.c2a {
        position: absolute;
        right: 2.75%;
        margin-top: 32px;
        border-radius: 6px;
        background-color: #FFF;
        padding: 8px 24px;
        > span {
            display: flex;
            font-weight: bold;
        }
    }
`;