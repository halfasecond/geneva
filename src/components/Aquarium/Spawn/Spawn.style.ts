import styled from 'styled-components'
import * as Styled from '../Aquarium.style'

export const Div = styled.div`
    display: flex;
    justify-content: space-between;
    margin-top: 6px;
    margin-bottom: 18px;
    > div {
        padding: 4px;
        border-radius: 6px;
        cursor: pointer;
    }
`

export const Button = Styled.Button