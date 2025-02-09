import styled from 'styled-components';

export const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
`;

export const ModalContent = styled.div`
    background-color: rgb(170, 255, 207);
    padding: 40px;
    border-radius: 8px;
    max-width: 700px;
    width: 90%;
    text-align: center;
    position: relative;

    p {
        margin-bottom: 15px;
        line-height: 1.4;

        a {
            color: #754c29;
            text-decoration: none;
            
            &:hover {
                text-decoration: underline;
            }
        }
    }
`;

export const Avatar = styled.div`
    width: 135px;
    height: 135px;
    border-radius: 50%;
    margin: 0 auto 28px;
    overflow: hidden;
    border: 4px solid #754c29;
    background: white;

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transform: scale(2) translate(-15%, 15px);  // Move left 15% and keep vertical at 15px
    }
`;

export const Title = styled.h2`
    font-family: 'Bungee', sans-serif;
    font-size: 24px;
    margin-bottom: 20px;
    color: #333;
`;

export const Button = styled.button`
    margin-top: 8px;
    background-color: #754c29;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 16px;
    font-family: 'Bungee', sans-serif;
    font-weight: normal;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
        background-color: #8b5e3c;
    }
`;