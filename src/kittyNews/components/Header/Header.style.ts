import styled from 'styled-components'
import { gutters } from 'kittyNews/style/config'

export const Header = styled.header`
    display: flex;
    position: fixed;
    bottom: 20px;
    z-index: 10000;
    left: 32px;
    justify-content: space-between;
    padding: ${gutters['md']} 0;
    > h1 {
        > a {
            display: flex;
            align-items: center;
            > img {
                width: 48px;
                margin-right: 16px;
            }
        }
    }
    > button {
        background-color: #EEE;
        border: 0;
        padding: ${gutters['sm']} ${gutters['md']};
        display: flex;
        align-items: center;
        border-radius: ${gutters['xs']};
        > svg {
            margin-right: ${gutters['sm']};
            width: 30px;
        }
    }
`