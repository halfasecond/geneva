import React, { useState, useEffect, useRef } from 'react';
import * as Styled from './ChatRoom.style';

interface Message {
    message: string;
    account: string;
    createdAt?: string | number;
    timestamp?: string | number;
    avatar?: number;
}

interface ChatRoomProps {
    messages: Message[];
    onSendMessage: (message: string) => void;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ messages, nfts, onSendMessage }) => {
    const [isOpen, setIsOpen] = useState(true);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            onSendMessage(input.trim());
            setInput('');
        }
    };

    const formatTime = (timestamp?: string | number) => {
        if (!timestamp) return '';
        const date = new Date(typeof timestamp === 'string' ? Date.parse(timestamp) : timestamp);
        return date.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    };

    const getAvatarUrl = (horseId?: number) => {
        if (!horseId) return undefined;
        const { svg, background } = nfts.find(({ tokenId }) => tokenId === horseId)
        return { svg, background }
    };

    const formatAddress = (address: string) => {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    return (
        <Styled.Container isOpen={isOpen}>
            <Styled.ToggleButton 
                isOpen={isOpen} 
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? '→' : '←'}
            </Styled.ToggleButton>

            <Styled.Header>
                <h2><span>🚜</span>Engagement Farm</h2>
            </Styled.Header>

            <Styled.MessagesContainer>
                {messages.map((msg, index) => {
                    const showAccount = index === 0 || messages[index - 1].account !== msg.account;
                    const avatar = getAvatarUrl(msg.avatar);
                    const timestamp = msg.timestamp || msg.createdAt;
                    
                    return (
                        <Styled.MessageGroup key={index}>
                            <div>
                                {showAccount && <Styled.Avatar url={avatar?.svg} />}
                                {!showAccount && <div style={{ width: 40 }} />}
                            </div>
                            <Styled.MessageContent>
                                {showAccount && (
                                    <Styled.MessageAccount>
                                        {formatAddress(msg.account)}
                                    </Styled.MessageAccount>
                                )}
                                <Styled.Message>
                                    {msg.message}
                                    <Styled.MessageTime>
                                        {formatTime(timestamp)}
                                    </Styled.MessageTime>
                                </Styled.Message>
                            </Styled.MessageContent>
                        </Styled.MessageGroup>
                    );
                })}
                <div ref={messagesEndRef} />
            </Styled.MessagesContainer>

            <Styled.InputContainer>
                <form onSubmit={handleSubmit}>
                    <Styled.Input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Send a message..."
                        autoComplete="off"
                    />
                </form>
            </Styled.InputContainer>
        </Styled.Container>
    );
};

export default ChatRoom;
