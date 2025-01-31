import styled from 'styled-components'
import { breaks, fontSize, grey, gutters } from '../../style/config'

export const Div = styled.div`
    padding: ${gutters['lg']};
    border-radius: ${gutters['xs']};
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: ${gutters['xs']};
    border: 2px dotted ${grey[900]};
    background-color: ${grey[100]};
    box-sizing: border-box;
    box-shadow: rgba(0,0,0,0.05) 10px 10px 30px;
    margin-bottom: ${gutters['lg']};
    max-width: 620px;
    width: 100%;
    > div {
        padding: ${gutters['md']} ${gutters['lg']};
        font-size: ${fontSize['sm']};
        @media (min-width: ${breaks['md']}) {
            font-size: ${fontSize['md']};
        }
        width: 100%;
        display: flex;
        justify-content: center;
        box-sizing: border-box;
        > b {
            display: inline-block;
            margin-left: ${gutters['md']};
            font-weight: bold;
        }
    }
`

export const Form = styled.form`
    padding: ${gutters['xl']};
    border-radius: ${gutters['xs']};
    border: 2px dotted ${grey[900]};
    background-color: ${grey[100]};
    box-sizing: border-box;
    box-shadow: rgba(0,0,0,0.05) 10px 10px 30px;
    display: flex;
    flex-direction: column;
    input {
        box-sizing: border-box;
    }
    input[type='text'], input[type='number'] {
        padding: ${gutters['md']} ${gutters['lg']};
        font-family: monospace;
        width: 100%;
        font-size: ${fontSize['md']};
        @media (min-width: ${breaks['md']}) {
            font-size: ${fontSize['lg']};
        }
        margin-bottom: ${gutters['md']};
    }
    input[type='submit'] {
        padding: ${gutters['md']} ${gutters['lg']};
        font-family: monospace;
        font-size: ${fontSize['sm']};
        @media (min-width: ${breaks['md']}) {
            font-size: ${fontSize['md']};
        }
        display: block;
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

    > code {
        font-size: ${fontSize['sm']};
        @media (min-width: ${breaks['md']}) {
            font-size: ${fontSize['md']};
        }   
        background-color: #EEE;
        padding: ${gutters['md']} ${gutters['lg']};
        border-radius: ${gutters['xs']};
        margin-bottom: ${gutters['lg']};
        > b {
            font-weight: bold; 
        }
    }
`