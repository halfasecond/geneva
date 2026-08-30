// @ts-nocheck
import styled from 'styled-components'

export const Div = styled.div`
    position: fixed;
    top: 0;
    width: 300px;
    left: ${({ open }) => (open ? '0' : '-300px')};
    @media (min-width: 700px) {
        width: 500px;
        left: ${({ open }) => (open ? '0' : '-500px')};
    }
    
    transition: left 0.3s ease-in-out;
    background-color: #FFF;
    padding: 60px 20px;
    box-sizing: border-box;
    border-right: 1px solid #666;
    z-index: 50000;
    overflow-y: auto;
    height: 100vh;
    display: flex;
    flex-direction: column;

    > header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-sizing: border-box;
        margin: 10px 0 20px 0;
        > div {
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            width: 20px;
            height: 20px;
            border: 1px solid #666;
            border-radius: 5px;
        }
    }
`