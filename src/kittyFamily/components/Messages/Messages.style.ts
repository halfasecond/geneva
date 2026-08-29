// @ts-nocheck
import { gutters, fontSize } from 'kittyFamily/style/config'
import styled from "styled-components"

export const Div = styled.div`
    margin-bottom: 24px;
    > div {
        margin-bottom: 24px;
        @media (min-width: 700px) {
          display: flex;
        }
        > a {
            > img {
                border-radius: 100%;
                width: 80px;
                margin: ${gutters['xs']} 0 0;
                @media (min-width: 700px) {
                    width: 80px;
                    margin: ${gutters['xs']} 0 0;
                }
            }
        }
        > div {
            flex-grow: 1;
            overflow: hidden;
            margin-left: ${gutters['sm']};
            > div {
                background-color: #EEE;
                padding: 6px 12px;
                font-size: ${fontSize['sm']};
                line-height: 2rem;
                border-radius:  0 0 ${gutters['xxs']} ${gutters['xxs']};
                &:first-of-type {
                    background-color: #CDCDCD;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    border-radius: ${gutters['xxs']} ${gutters['xxs']} 0 0;
                }
                &:last-of-type {
                    background-color: #FFF;
                    font-size: ${fontSize['xs']};
                }
            }
        }
    }
`