// @ts-nocheck
import styled from 'styled-components'
import * as Styled from 'kittyFamily/style'
import { colors, gutters, fontSize, grey } from 'kittyFamily/style/config'

export const Div = styled.div`
    padding: ${gutters['xxl']} 0;
    display: flex;
    flex-direction: column;
    margin-bottom: ${gutters['md']};
    > img {
        width: 30px;
        margin: 0 auto ${gutters['xs']};
    }
    > h2, > h3 {
        width: 100%;
        text-align: center;
        margin-bottom: ${gutters['lg']};
        font-size: ${fontSize['lg']};
    }
    > h3 {
        color: ${grey[900]};
    }
    > p {
        text-align: center;
        font-size: ${fontSize['md']};
        margin: 0 5% ${gutters['sm']};
        &:last-of-type {
            margin-bottom: ${gutters['xl']};
        }
    }
    >ul {
        display: flex;
        margin: 0 5% ${gutters['lg']};
        flex-wrap: wrap;
        text-align: center;
        justify-content: center;
        > li {
            list-style-type: none;
            margin-right: ${gutters['md']};
            margin-bottom: ${gutters['sm']};
            color: ${grey[800]};
            cursor: pointer;
            font-weight: bold;
            &:last-of-type {
                margin-right: 0;
            }
            &.selected {
                color: ${colors.secondary};
            }
            &:hover {
                text-decoration: underline;
            }
        }
    }
}`
