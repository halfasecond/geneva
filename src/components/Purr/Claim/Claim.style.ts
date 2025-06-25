import styled from 'styled-components'
import { breaks, headingSize, fontSize, grey, gutters } from '../../../style/config'

export const Div = styled.div`
    line-height: 48px;
    text-align: center;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-sizing: border-box;
    margin: 0 4%;
    width: 92%;
    @media (min-width: ${breaks['md']}) {
        min-width: 640px;
    }

    > img {
        margin: ${gutters['xl']} 0; 
    }

    > p {
        margin-bottom: ${gutters['lg']};
        font-size: ${fontSize['md']};
    }

    > ol {
        margin-bottom: ${gutters['md']};
        > li {
            margin-bottom: ${gutters['sm']};
            > span.mobileOnly {
                display: none; 
            }
        }
    }

    > div {
        display: flex;
        justify-content: space-around;
        width: 100%;
        max-width: 720px;
        margin: ${gutters['md']} auto ${gutters['md']};
        @media (min-width: ${breaks['md']}) {
            margin: ${gutters['md']} auto ${gutters['xl']};
        }
        flex-wrap: wrap;
        > div {
            width: 48%;
            margin-bottom: ${gutters['md']};
            max-width: 160px;
            @media (min-width: ${breaks['md']}) {
                width: 22%;
                margin-bottom: 0;
            }
            background-color: ${grey[200]};
            color: ${grey[700]};
            padding: ${gutters['xs']} ${gutters['md']} ${gutters['xs']} ${gutters['sm']};
            box-sizing: border-box;
            line-height: ${fontSize['md']};
            font-size: ${fontSize['md']};
            font-weight: bold;
            border-radius: ${gutters['xs']};
            display: flex;
            align-items: center;
            box-shadow: 0 0 24px ${grey[400]};
            > img {
                width: 24px;
                height: 24px;
                margin-right: ${gutters['sm']};
                &.diamond {
                    width: 20px;
                    height: 20px;
                }
            }
        }
    }
`

export const Form = styled.form`
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: rgba(0,0,0,0.95);
    padding: ${gutters['xxl']} 0;
    border-radius: 4px;
    box-shadow: 0 0 24px rgba(236, 35, 165, 0.1);
    border: 12px solid rgba(255,255,255,0.1);
    box-sizing: border-box;
    width: 100%;
    max-width: 780px;

    > div.logo {
        background-repeat: no-repeat;
        background-position: center;
        background-size: 88%;
        background-color: ${grey[200]};
        border-radius: 100%;
        width: 24px;
        height: 24px;
        @media (min-width: ${breaks['md']}) {
            width: 100px;
            height: 100px;
        }
        padding: ${gutters['md']};
        margin-bottom: ${gutters['xl']};
    }
 
    > h4 {
        font-size: ${fontSize['md']};
        margin-bottom: ${gutters['md']};
        @media (min-width: ${breaks['md']}) {
            font-size: ${fontSize['lg']};
            margin-bottom: ${gutters['lg']};
        }
        + p {
            font-size: ${fontSize['md']};
            margin-bottom: ${gutters['lg']};
        }
        &:first-of-type {
            font-size: ${fontSize['lg']};
            @media (min-width: ${breaks['md']}) {
                font-size: ${fontSize['xl']};
                margin-bottom: ${gutters['lg']};
            }
            + p {
                display: none;
                @media (min-width: ${breaks['md']}) {
                    display: block;
                    margin-bottom: ${gutters['xl']};
                }
            }
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

    input[type='submit'], button {
        display: block;
        max-width: 540px;
        box-sizing: border-box;
        padding: ${gutters['md']} ${gutters['lg']};
        font-family: bungee, sans-serif;
        font-size: ${fontSize['sm']};
        font-weight: normal;
        line-height: ${fontSize['sm']};
        border-radius: ${gutters['xs']};
        @media (min-width: ${breaks['md']}) {
            font-size: ${fontSize['md']};
        }
        margin-top: ${gutters['md']};
    }

    input[type='text'] {
        margin-bottom: ${gutters['lg']};
        border-radius: ${gutters['xs']};
        background-color: ${grey[0]};
        width: 280px;
        text-align: center;
        font-size: ${fontSize['lg']};
        font-family: bungee, sans-serif;
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
        display: flex;
        align-items: center;
        > span {
            cursor: pointer;
            display: inline-block;
            border-bottom: 1px dotted #FFF; 
        } 
    }

    b {
        font-weight: bold;
        display: inline-block;
        margin-left: ${gutters['sm']};
        > img {
            width: 20px; 
        }
    }
`