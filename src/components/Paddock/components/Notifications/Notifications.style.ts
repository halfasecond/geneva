import styled from 'styled-components';
import { Z_LAYERS } from 'src/config/zIndex';

export const Container = styled.div`
    position: fixed;
    top: 70px;
    left: 20px;
    width: 410px;
    max-height: 80vh;
    z-index: ${Z_LAYERS.UI};
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

export const NotificationItem = styled.div`
    background-color: #F6F6F6;
    box-shadow: 2px 2px 2px 1px rgba(0, 0, 255, .2);
    border: 1px solid #FFF;
    border-radius: 2px;
    padding: 12px;
    color: white;
    animation: slideIn 0.3s ease-out;
    display: flex;
    align-items: flex-start;
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    &.exiting {
        animation: slideOut 0.3s ease-in forwards;
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;

export const Title = styled.h3`
    margin: 0;
    font-size: 16px;
    display: flex;
    align-items: flex-start;
    
    > div {
        margin-right: 8px;
        width: 56px;
        height: 56px;
        fill: #333;
        margin-right: 18px;
        background-size: contain;
        &.ghost {
            background-size: 350% auto;
            background-position: 105% 210%;
        }
        &.horse {
            background-size: 220% auto;
            background-position: 80% 24%;
            border-radius: 100%;
            box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
        }
    }
`;

export const CloseButton = styled.button`
    background: none;
    border: none;
    color: #aaa;
    cursor: pointer;
    font-size: 16px;
    padding: 0;
    
    &:hover {
        color: white;
    }
`;

export const Content = styled.div`
    > p {
        font-size: 12px;
        color: #333;
        > b {
            font-weight: 600;
        }
    }
`;