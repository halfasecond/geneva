import styled from 'styled-components'
import { breaks, headingSize, fontSize, gutters } from 'style/config'

export const Div = styled.div`
    line-height: 48px;
    text-align: center;
    border-radius: 4px;
    background-color: rgba(0,0,0,0.9);
    display: flex;
    flex-direction: column;
    align-items: center;
    box-sizing: border-box;
    margin: 0 2%;
    width: 96%;
    @media (min-width: ${breaks['md']}) {
        min-width: 640px;
    }

    > img {
        margin: ${gutters['xl']} 0; 
    }

    > p {
        padding-top: ${gutters['lg']};
        &:last-of-type {
            padding-bottom: ${gutters['lg']};
        }
        font-size: ${fontSize['md']};
        @media (min-width: ${breaks['md']}) {
            font-size: ${fontSize['xmd']};
        }
    }
`

export const Form = styled.form`
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: rgba(0,0,0,0.75);
    padding: ${gutters['xl']};
    border-radius: 4px;
    box-shadow: 0 0 24px rgba(236, 35, 165, 0.1);
    border: 24px solid rgba(255,255,255,0.1);
    box-sizing: border-box;

    > p.claim {
        font-family: bungee, sans-serif;
        text-align: center;
        font-size: ${fontSize['md']};
        @media (min-width: ${breaks['md']}) {
            font-size: ${fontSize['lg']};
        }
        text-shadow: 2px 2px 3px rgba(255,255,255,0.4);
        padding: ${gutters['md']} ${gutters['lg']};
        > span {
            display: block;
            font-weight: bold;
            font-size: ${fontSize['xl']};
            margin-top: ${gutters['md']};
        }  
    }

    > h2 {
        text-align: center;
        margin-bottom: ${gutters['xl']};
        font-size: ${fontSize['xl']};
        @media (min-width: ${breaks['md']}) {
            font-size: ${headingSize['lg']};
        }
        text-shadow: 2px 2px 3px rgba(255,255,255,0.4);
    }

    input[type='submit'] {
        display: block;
        max-width: 540px;
        box-sizing: border-box;
        padding: ${gutters['md']} ${gutters['lg']};
        font-family: monospace;
        font-size: ${fontSize['sm']};
        @media (min-width: ${breaks['md']}) {
            font-size: ${fontSize['md']};
        }
            margin-top: ${gutters['xl']};
    }

    > label {
        display: flex;
        flex-direction: column;
        align-items: center;
        font-weight: bold;
        font-size: ${fontSize['sm']};
        @media (min-width: ${breaks['md']}) {
            font-size: ${fontSize['md']};
        }
        > input {
            margin-top: ${gutters['lg']};
            display: block;
            &.tokenId {
                display: inline-block;
            }
        }
    }

    > p {
        margin: 0 0 ${gutters['md']};
        > span {
            cursor: pointer;
            display: inline-block;
            border-bottom: 1px dotted #FFF; 
        } 
    }

    b {
        font-weight: bold; 
    }
`