import { grey, gutters } from 'style/config'
import styled from 'styled-components'

export const Div = styled.div`
    background-color: ${grey[200]};
    padding: ${gutters['sm']} ${gutters['md']};
    border-radius: ${gutters['xs']};
    font-weight: bold;
    width: 450px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px dotted ${grey[900]};
    background-color: ${grey[100]};
    box-sizing: border-box;
    box-shadow: rgba(0,0,0,0.05) 10px 10px 30px;
    margin-bottom: ${gutters['lg']};
`