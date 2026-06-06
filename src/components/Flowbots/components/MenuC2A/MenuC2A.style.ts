import styled from 'styled-components'
import { Link as _Link } from 'react-router-dom'

export const Link = styled(_Link)`
    position: fixed;
    top: 28px;
    left: 2.5%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100000;
    > img {
        border-radius: 4px;
        width: 38px;
        height: 38px;
        margin-right: 12px;
        box-shadow: 10px 10px 30px rgba(77,173,212,0.25);
    }
    > h1 {
        display: none;
        font-size: 20px;
        border-bottom: 2px dotted transparent;
    }
    &:hover {
        > h1 {
            border-bottom: 2px dotted #333;
            cursor: pointer;
        }
    }
`