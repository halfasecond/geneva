import React, { useState, useEffect, useRef } from 'react';
import * as Styled from './ChatRoom.style';
import { bgColors } from 'src/style/config';
import { hostname } from 'os';

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
    isOpen: number;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ messages, nfts, onSendMessage, isOpen, setIsOpen }) => {
    const [input, setInput] = useState('');
    const [backgroundColor, setBackgroundColor] = useState('transparent');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen === 0) { // Scrolls to last chat room message
            scrollToBottom();
        }
    }, [messages, isOpen]);

    useEffect(() => {
        if (isOpen) {
            const getLastHorseBackgroundColor = () => {
                const horseIndex = Math.floor(Math.random() * nfts.length)
                const horse = nfts[horseIndex]
                return horse && horse.background ? bgColors[horse.background] : 'transparent'
            }
            setBackgroundColor(getLastHorseBackgroundColor())
        }
    }, [isOpen])

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

    const emojis = ['🚜', '🐎', '📰']
    const headers = ['Engagement Farm', 'Chained Horses', 'Latest News']

    return (
        <Styled.Container isOpen={isOpen >= 0}>
            <Styled.ToggleButton
                isOpen={isOpen >= 0}
                onClick={() => setIsOpen(-1)}
            >
                {isOpen ? '→' : '←'}
            </Styled.ToggleButton>

            <Styled.Header>
                {isOpen >= 0 && (<h2><span>{emojis[isOpen]}</span>{headers[isOpen]}</h2>)}
            </Styled.Header>
            {isOpen === 0 && (
                <>
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
                </>
            )}
            {isOpen === 1 && (
                <Styled.MessagesContainer>
                    <Styled.Grid>
                        {nfts.map((horse, i) => {
                            return (
                                <img 
                                    key={i}
                                    src={horse.svg}
                                    alt={`Chained Horse #${horse.tokenId}`} 
                                />
                            )
                        })}
                    </Styled.Grid>
                </Styled.MessagesContainer>
            )}
            {isOpen === 2 && (
                <Styled.MessagesContainer></Styled.MessagesContainer>
            )}
            <Styled.Panel style={{ backgroundColor }} />
        </Styled.Container>
    );
};

export default ChatRoom;
