import styled from 'styled-components'
import { fontSize, grey, gutters } from 'kittyNews/style/config'

export const Div = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: ${grey[100]};
    padding-top: ${gutters['xl']};
    border-radius: 12px;
    border: 1px solid ${grey[200]};
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
        box-sizing: border-box;
        > div {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin: 0 ${gutters['sm']};
            > label {
                margin: 0 0 ${gutters['md']};
                font-weight: bold;
                color: ${grey[700]};
                font-size: 12px;
            }
            > input {
                margin: 0 0 ${gutters['md']};
                padding: ${gutters['sm']};
                border-radius: 2px;
                border: 0px;
                width: 120px;
                font-size: 12px;
            }
            > select {
                padding: ${gutters['sm']};
                border-radius: 2px;
                border: 0px;
                font-size: 12px;
            }
        }

        &:last-of-type {
            flex-direction: column;
            align-items: center;
        }

        > button {
            margin: 0 0 ${gutters['sm']};
            padding: ${gutters['md']} ${gutters['md']};
            border-radius: 2px;
            border: 0px;
            background-color: ${grey[300]};
            font-size: ${fontSize['xsm']};
        }

        > ul {
            text-align: center;
            > li {
                font-size: 12px;
            }
            
        }
        > h2 {
            margin-bottom: ${gutters['md']};
        }
    }
`