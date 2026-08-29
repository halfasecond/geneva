// @ts-nocheck
import styled from 'styled-components'
import { Main as _Main } from 'kittyFamily/style'
import { breaks, gutters, fontSize } from 'kittyFamily/style/config'

export const Main = styled(_Main)`
    max-width: 1792px;
    margin: 0 auto;
    > h2 { /* Featured Kitties */
            margin: 100px 0 30px;
            font-size: ${fontSize['lg']};
            &:last-of-type {
            margin: 0 0 30px;
            }
    }
    > img {
            margin: 100px 0 4px;
    }
    > h3 {
        padding: ${gutters['lg']} 0 ${gutters['xxl']};
    }
    > h4 {
        margin: 24px 5%;
    }
    > p {
        padding: 0 5%; 
        &:first-of-type {
            padding: 140px 5% 0;
            @media (min-width: 700px) {
                padding: 0 5%;
            }
        }
        @media (min-width: 700px) {
            padding: 0 5%;
            max-width: 800px;
            margin: 0 auto;
            line-height: 36px;
        }
        &:last-of-type {
            margin-bottom: ${gutters['xl']};
        }
    }
    > img {
            width: 40px;
    }

    > div {
        &:last-of-type {
            > div {
                &:last-of-type {
                    display: none;
                    @media (min-width: ${breaks['xxxl']}) {
                        display: flex;
                    }
                }
            }
        }
    }
`
