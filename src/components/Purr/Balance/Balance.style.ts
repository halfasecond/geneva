import styled from 'styled-components'
import {  breaks, fontSize, grey, gutters } from '../../../style/config'

export const Div = styled.div`
    position: fixed;
    top: 20px;
    @media (min-width: ${breaks['md']}) {
        top: auto;
        bottom: 20px;
    }
    right: 20px;
    z-index: 1000;
    background-color: ${grey[200]};
    padding: ${gutters['sm']} ${gutters['md']};
    > span {
        font-family: bungee, sans-serif;
        cursor: pointer;
        user-select: none;
        &:hover {
            opacity: 0.8;
        }
    }
    
    border-radius: ${gutters['xs']};
    box-shadow: 0 0 24px ${grey[500]};
    border: 1px solid ${grey[400]};

    &.menu {
        top: 72px;
        margin-left: ${gutters['md']};
        @media (min-width: ${breaks['md']}) {
            bottom: 72px;
            top: auto;
        }
        > form {
            padding-top: ${gutters['md']};

            > * {
                width: 100%;
            }

            > h4 {
                margin-bottom: ${gutters['lg']};
                color: ${grey[900]};
            }

            input[type='submit'], button {
                display: block;
                max-width: 540px;
                box-sizing: border-box;
                padding: ${gutters['md']} ${gutters['lg']};
                font-family: bungee, sans-serif;
                font-weight: normal;
                line-height: ${fontSize['sm']};
                border-radius: ${gutters['xs']};
                margin-bottom: ${gutters['md']};
                font-size: ${fontSize['sm']};
                @media (min-width: ${breaks['md']}) {
                    font-size: ${fontSize['xsm']};
                }
            }

            input[type='text'], input[type='number'] {
                padding-left: ${gutters['sm']};
                padding-right: ${gutters['sm']};
                box-sizing: border-box;
                border-radius: ${gutters['xs']};
                background-color: ${grey[0]};
                margin-bottom: ${gutters['md']};
                width: 100%;
                text-align: center;
                font-size: ${fontSize['sm']};
                @media (min-width: ${breaks['md']}) {
                    font-size: ${fontSize['xsm']};
                }
                font-family: bungee, sans-serif;
            }
        }
    }
`