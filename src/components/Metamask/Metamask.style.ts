import styled from 'styled-components'
import { grey, gutters } from 'style/config'

export const Button = styled.button`
    background-color: #EEE;
    color: #1a1a1a;
    border: 0;
    padding: ${gutters['sm']} ${gutters['md']};
    display: flex;
    align-items: center;
    border-radius: ${gutters['xs']};
    line-height: 30px;
    font-weight: 600;
    cursor: pointer;
    > svg, > img {
        margin-right: ${gutters['sm']};
        width: 30px;
    }
    > img {
        border-radius: 4px;
    }
    box-shadow: 0 0 24px ${grey[400]};
    border: 1px solid ${grey[400]};
`