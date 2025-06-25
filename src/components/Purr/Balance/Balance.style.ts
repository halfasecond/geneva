import styled from 'styled-components'
import {  breaks, fontSize, grey, gutters } from '../../../style/config'

export const Div = styled.div`
    position: fixed;
    top: 20px;
    @media (min-width: ${breaks['md']}) {
        top: auto;
        bottom: 20px;
    }
    right: 20px;
    z-index: 1000;
    background-color: ${grey[200]};
    padding: ${gutters['sm']} ${gutters['md']};
    > span {
        font-family: bungee, sans-serif;
        cursor: pointer;
        user-select: none;
        &:hover {
            opacity: 0.8;
        }
    }
    
    border-radius: ${gutters['xs']};
    box-shadow: 0 0 24px ${grey[400]};
    border: 1px solid ${grey[400]};

    &.menu {
        > * {
            width: 100%;
            margin-bottom: ${gutters['md']};

        }
        @media (min-width: ${breaks['md']}) {
            bottom: 72px;
        }
    }
`