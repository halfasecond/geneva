import styled from 'styled-components'
import * as Styled from '../../style'

export const colors = Styled.colors

export const Div = styled.div`
    width: 100%;
    padding-top: 96px;
    > h2 {
        margin-bottom: 24px;
        text-align: center;
    }

    > h3 {
        line-height: 24px;
        text-align: center;
        margin-bottom: 36px;
    }
`

export const Search = styled.div`
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
   
    padding: 0 2.5% 48px;
    box-sizing: border-box;
    
    > div {
        margin-bottom: 16px;
        min-width: 520px;
        box-sizing: border-box;
        display: flex;
        background-color: #F6F6F6;
        padding: 12px 18px;
        border-radius: 4px;
        position: relative;
        border: 2px dotted rgba(77,173,212,1);
        justify-content: center;
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
            > div {
                > button {
                    border: none; 
                }
            }
        }  
    } 
    @media (min-width: 1280px) {
        flex-direction: row;
        > div {
            margin-bottom: 0;
            margin-right: 24px;
            min-width: auto;
            &:last-of-type {
                margin-right: 0;
            }
        }
    }
`

export const Grid = styled(Styled.Grid)`
    margin: 0 2.5%;
    @media (min-width: 1820px) {
        margin: 0 auto;
    }
    > * {
        width: 48%;
        margin-bottom: 36px;
        @media (min-width: 920px) {
            width: 22.5%;
        }
        @media (min-width: 1280px) {
            width: 18.5%;
        }
        > a {
            display: block;
            box-shadow: 10px 10px 30px rgba(77,173,212,0.25);
            border: 1px solid #666;
            margin-bottom: 18px;
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
        > h2 {
            display: flex;
            justify-content: space-between;
            align-items: center;
            > span {
                display: block;
                &:last-of-type {
                    background-color: #FFF;
                    padding: 6px 12px;
                    border-radius: 4px;
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

export const Pagination = styled.div`
    width: 100%;
    display: flex;
    justify-content: space-between;
    padding-bottom: 96px;
    font-family: monospace;
    > div {
        width: 80%;
        > button {
            border: 0;
            margin-left: 24px;
            font-family: monospace;
            font-weight: bold;
        } 
    }
`

