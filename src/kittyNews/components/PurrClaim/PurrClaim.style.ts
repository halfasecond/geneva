import styled from 'styled-components'
import { fontSize, grey, gutters } from 'kittyNews/style/config'

export const Div = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-image: url('https://cdn.halfasecond.com/images/purr/bg.svg');
    background-image: no-repeat;
    background-size: 250% auto;
    padding-top: ${gutters['xl']};
    border-radius: 12px;
    border: 1px solid ${grey[200]};
    color: ${grey[0]};

    b {
        font-weight: bold;
    }

    > p {
        margin-bottom: ${gutters['md']};
        text-align: center;
    }

     > ol {
        margin-bottom: ${gutters['lg']};
        text-align: center;
    }

    p > a {
        display: inline-block;
        color: ${grey[100]};
        text-decoration: none;
        border-bottom: 2px dotted ${grey[100]};
    }

    > img {
        width: 64px;
        border-radius: 8px;
        margin-bottom: ${gutters['xlg']};
    }
    > h2 {
        color: ${grey[0]};
        margin-bottom: ${gutters['xlg']};
        font-size: ${fontSize['lg']};
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
                margin: 0 0 ${gutters['lg']};
                font-weight: bold;
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
            > select {
                padding: ${gutters['sm']};
                border-radius: 2px;
                border: 0px;
                font-size: 12px;
            }
        }

        > img {
            width: 28px;
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