import { grey, gutters } from 'style/config'
import styled from 'styled-components'

export const Div = styled.div`
    position: fixed;
    top: ${gutters['md']};
    right: ${gutters['md']};
    background-color: ${grey[200]};
    padding: ${gutters['sm']} ${gutters['md']};
    border-radius: ${gutters['xs']};
    font-weight: bold;
`