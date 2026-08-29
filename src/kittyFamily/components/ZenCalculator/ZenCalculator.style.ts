// @ts-nocheck
import styled from 'styled-components'
import { breaks, fontSize, grey, gutters } from 'kittyFamily/style/config'

export const Section = styled.section`
    box-sizing: border-box;
    margin: 0 auto ${gutters['xxl']};
    padding-bottom: ${gutters['xxl']};
    width: 96%;
    > h2 {
        width: 100%;
        text-align: center;
        font-size: ${fontSize['xmd']};
        color: ${grey[800]};
        @media (min-width: ${breaks['xlg']}) {
            font-size: ${fontSize['lg']};
        }
    }
    > p {
        margin-bottom: ${gutters['xxl']};
    }

    display: flex;
    justify-content: center;
    
    > div {
        background-color: ${grey[100]};
        width: 560px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background-color: ${grey[100]};
        padding-top: ${gutters['xl']};
        border-radius: 12px;
        > img {
            width: 64px;
            border-radius: 8px;
            margin-bottom: ${gutters['xlg']};
        }
        > h2 {
            margin-bottom: ${gutters['xlg']};
        }
        > div {
            display: flex;
            align-items: flex-start;
            justify-content: center;
            margin-bottom: ${gutters['xl']};
            > div {
                display: flex;
                flex-direction: column;
                align-items: center;
                margin: 0 ${gutters['sm']};
                > label {
                    margin: 0 0 ${gutters['md']};
                    font-weight: bold;
                    color: ${grey[700]};
                    font-size: ${fontSize['md']};
                }
                > input {
                    margin: 0 0 ${gutters['md']};
                    padding: 0;
                    border-radius: 2px;
                    border: 0px;
                }
                > select {
                    padding: ${gutters['xs']};
                    border-radius: 2px;
                    border: 0px;
                }
            }

            &:last-of-type {
                flex-direction: column;
                align-items: center;
            }

            > button {
                margin: 0 0 ${gutters['sm']};
                padding: ${gutters['sm']} ${gutters['sm']};
                border-radius: 2px;
                border: 0px;
                background-color: ${grey[300]};
                font-size: ${fontSize['xsm']};
            }

            > ul {
                text-align: center;
                > li {
                    list-style-type: none;
                }
            }
            > h2 {
                margin-bottom: ${gutters['md']};
            }       
        }
    }
    
`