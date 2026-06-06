import styled from 'styled-components'

export const Image = styled.img`
    position: fixed;
    z-index: 10000;
    right: 24px;
    bottom: 18px;
    width: 48px;
    border-radius: 4px;
    box-shadow: 10px 10px 30px rgba(0, 0, 0, 0.1);
    border: 2.5px dotted #999;
    opacity: 0.8;
    cursor: pointer;
    &:hover {
        opacity: 1;
    }
`