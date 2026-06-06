import styled from 'styled-components'


export const Div = styled.div`
    position: fixed;
    right: 2.5%;
    top: 28px;
    z-index: 1000000;
    display: none;
`

export const Button = styled.button`
    background-color: #BBB;
    border: 0;
    padding: 6px 10px;
    display: flex;
    align-items: center;
    border-radius: 4px;
    width: 100%;
    > img {
        margin-right: 8px;
        width: 30px;
    }
`