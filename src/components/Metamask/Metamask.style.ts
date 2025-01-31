import styled from 'styled-components'
import { gutters } from 'style/config'

export const Button = styled.button`
    position: fixed;
    bottom: ${gutters['xlg']};
    left: ${gutters['xlg']};
    background-color: #EEE;
    border: 0;
    padding: ${gutters['sm']} ${gutters['md']};
    display: flex;
    align-items: center;
    border-radius: ${gutters['xs']};
    line-height: 30px;
    > svg, > img {
        margin-right: ${gutters['sm']};
        width: 30px;
    }
    > img {
        border-radius: 4px;
    }
    z-index: 1;
`