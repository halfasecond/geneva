import styled from 'styled-components';

export const Button = styled.button`
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgb(170, 255, 207);
    border: 3px solid #754c29;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    cursor: pointer;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    svg {
        width: 24px;
        height: 24px;
        fill: #754c29;
        transition: fill 0.2s ease;
    }

    &:hover {
        background: #754c29;
        transform: scale(1.05);
        
        svg {
            fill: rgb(170, 255, 207);
        }
    }
`;