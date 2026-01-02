import styled from 'styled-components';
import { Z_LAYERS } from 'src/config/zIndex';

export const Header = styled.div`
    padding: 16px 20px;
    background: rgba(32, 34, 37, 0.95);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;

    h2 {
        color: #ffffff;
        font-size: 16px;
        margin: 0;
        > span {
            display: inline-block;
            margin-right: 12px; 
        }
    }
`;

export const Container = styled.div`
    position: fixed;
    width: 100%;
    top: 0;
    height: 100vh;
    @media (min-width: 520px) {
        top: 170px;
        width: 480px;
        height: calc(100vh - 180px - 100px);
    }
    
    background: rgba(47, 49, 54, 0.95);
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    transition: left 0.3s ease;
    display: flex;
    flex-direction: column;
    z-index: ${Z_LAYERS['UI'] - 1};
`;

export const MessagesContainer = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 2px;

    &::-webkit-scrollbar {
        width: 8px;
    }

    &::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.2);
    }

    &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.2);
    }
`;

export const MessageGroup = styled.div`
    display: flex;
    gap: 12px;
    padding: 2px 0;
    animation: fadeIn 0.2s ease-in;

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    &:hover {
        background: rgba(255, 255, 255, 0.02);
    }

    margin-bottom: 12px;
`;

export const Avatar = styled.div<{ url?: string }>`
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: ${props => props.url ? `url(${props.url})` : 'rgba(0, 0, 0, 0.2)'};
    background-size: 250%;
    background-position: 80% 25%;
    background-repeat: no-repeat;
    border: 2px solid rgba(255, 255, 255, 0.1);
    flex-shrink: 0;
    transition: border-color 0.2s ease;

    &:hover {
        border-color: rgba(255, 255, 255, 0.3);
    }
`;

export const MessageContent = styled.div`
    flex: 1;
    min-width: 0;
`;

export const Message = styled.div`
    color: #dcddde;
    font-size: 14px;
    line-height: 1.4;
    word-wrap: break-word;
    padding: 2px 0;
    display: flex;
    align-items: baseline;
    gap: 8px;
    flex-direction: column;
`;

export const MessageTime = styled.span`
    color: #72767d;
    font-size: 11px;
    flex-shrink: 0;
`;

export const MessageAccount = styled.div`
    color: #00b0f4;
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;

    &:hover {
        text-decoration: underline;
    }
`;

export const InputContainer = styled.div`
    padding: 20px;
    background: rgba(40, 42, 46, 0.95);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

export const Input = styled.input`
    width: 100%;
    padding: 12px;
    background: rgba(64, 68, 75, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    color: #ffffff;
    font-size: 14px;
    box-sizing: border-box;
    transition: border-color 0.2s ease;

    &:focus {
        outline: none;
        border-color: #00b0f4;
        background: rgba(64, 68, 75, 1);
    }

    &::placeholder {
        color: #72767d;
    }
`;

export const Panel = styled.div`
    height: 118px;
    border-top: 2px solid #000;
`

export const Grid = styled.div`
    display: flex;
    justify-content: space-evenly;
    flex-wrap: wrap;
    > * {
        width: 32%;
        margin-bottom: 4px;
    }
`

export const Close = styled.div`
    position: absolute;
    top: 10px;
    right: 18px;
    cursor: pointer;
    font-size: 24px;
    font-weight: bold;
    opacity: 0.6;
    &:hover {
        opacity: 0.8;
    }
`
