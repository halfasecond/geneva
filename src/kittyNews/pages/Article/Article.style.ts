import styled from 'styled-components'
import * as Styled from 'kittyNews/style'
import { breaks, fontSize, gutters } from 'kittyNews/style/config'

export const Div = styled(Styled.Div)`
    box-sizing: border-box;
    width: 90%;
    @media (min-width: ${breaks['lg']}) {
        width: 60%;
    }
    > h2 {
        font-size: ${fontSize['md']};
        @media (min-width: ${breaks['md']}) {
            font-size: ${fontSize['lg']};
        }
        @media (min-width: ${breaks['xl']}) {
            font-size: ${fontSize['xl']};
        }
        margin-bottom: 0;
        text-align: center;
    }
    b {
        font-weight: bold;
    }
    > h3 {
        margin: ${gutters['xl']} 0 ${gutters['lg']};
        color: #555;
        &:first-of-type {
            text-align: center;
            margin-bottom: ${gutters['xl']};
        }
        font-size: ${fontSize['md']};
        @media (min-width: ${breaks['md']}) {
            font-size: ${fontSize['xmd']};
        }
    }
    > p {
        margin-bottom: ${gutters['lg']};
        @media (min-width: ${breaks['md']}) {
            font-size: ${fontSize['md']};
        }
        > i {
            font-style: italic;
        }
    }
    > code, > * > code {
        display: inline-block;
        background-color: rgb(243, 241, 238);
        width: 100%;
        margin-bottom: ${gutters['md']};
        padding:  ${gutters['md']} ${gutters['md']};
        text-align: center;
        border: 1px solid rgb(196, 195, 192);
        word-break: break-all;
        white-space: pre-wrap;
    }
    > blockquote {
        width: 95%;
        @media (min-width: ${breaks['md']}) {
            font-size: ${fontSize['xmd']};
        }
        line-height: 32px;
        margin-bottom: ${gutters['lg']};
        padding: 0 ${gutters['md']};
    }
    > img {
        margin: ${gutters['lg']} 0 ${gutters['xl']} 10%;
        border-radius: 4px;
        width: 80%;
        box-shadow: 10px 10px 30px rgba(0,0,0,0.1);
        &:last-of-type {
            margin-right: 0;
        }
    }

    > a.tag {
        display: inline-block;
        border: 1px #EEE solid;
        padding: ${gutters['sm']} ${gutters['md']};
        margin: ${gutters['lg']} ${gutters['sm']} 0 0;
        font-weight: bold;
        color: #666;
    }
    > ul {
        display: flex;
        flex-direction: column;
        padding-top: ${gutters['lg']};
        > li {
            margin-bottom: ${gutters['sm']};
            margin-left: ${gutters['md']};
            list-style-type: square;
        }
    }
    > .react-share__ShareButton {
        margin-right: ${gutters['sm']}; 
    }
`

export const Grid = styled(Styled.Grid)`
    justify-content: space-evenly;
    padding: ${gutters['xl']} 0;
    background-color: #EEE;
    margin: ${gutters['xl']} 0;
    border-radius: 2px;
    width: 98%;
    > * {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex-wrap: wrap;
        width: 48%;
        @media (min-width: ${breaks['xlg']}) {
            width: 28%;
        }
        @media (min-width: ${breaks['xxl']}) {
            width: 14%;
        }
        > img {
            width: 50%;
            margin-bottom: ${gutters['xlg']};
            border-radius: ${gutters['sm']};
        }
        > h3 {
            margin-bottom: ${gutters['xxl']};
            @media (min-width: ${breaks['xxl']}) {
                margin-bottom: ${gutters['sm']};
            }
            font-weight: bold;
            text-align: center;
        }
    }
`

export const Section = styled(Styled.Section)`
    padding: ${gutters['xxl']} 0 0;
    box-sizing: border-box;
    > h2 {
        margin-bottom: ${gutters['lg']}; 
    }
`
