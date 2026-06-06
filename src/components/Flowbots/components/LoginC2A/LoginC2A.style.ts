import styled from 'styled-components'

export const Button = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 239, 139, 1);
    border: 0;
    padding: 6px 20px 6px 10px;
    box-shadow: 10px 10px 30px rgba(0, 239, 139, 0.25);
    > img {
        width: 24px;
        height: 24px;
        margin-right: 12px;
    }
    font-weight: bold;
    position: fixed;
    right: 2.5%;
    top: 28px;
    border-radius: 4px;
    &:hover {
        opacity: 0.8;
    }
`