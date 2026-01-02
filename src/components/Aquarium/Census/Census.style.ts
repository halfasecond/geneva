import styled from 'styled-components'
import * as Styled from '../Aquarium.style'

export const Div = styled.div`
    display: flex;
    color: #eef;
    font-family: system-ui;
    flex-wrap: wrap;
    justify-content: space-around;
    margin-bottom: 18px;
    > div {
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        > span {
            opacity: 0.7;
            user-select: none;
            display: inline-block;
            padding-right: 24px;
        }
    }
`

export const Button = Styled.Button