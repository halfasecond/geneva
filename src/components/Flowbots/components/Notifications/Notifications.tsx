import { Link } from 'react-router-dom'
import React, { useEffect, useState } from 'react'
import { unPadAndFormatPrice } from '../../utils/format'
import Contracts from '../App/contracts'
import * as Styled from './Notifications.style'
import { Socket } from 'socket.io-client'

interface NotificationEvent {
    event: 'HighestBidIncreased' | 'Birth' | 'SaleSuccessful' | 'SaleCreated';
    tokenId: number;
    blockNumber: number;
    amount?: string; // Optional for events without amount
    from: string;
    owner?: string; // Optional for events without owner
    startPrice?: string; // Optional for SaleCreated
    id?: string; // Added dynamically
    addedAt?: number; // Added dynamically
}

const Notifications: React.FC<{ socket: Socket | null }> = ({ socket }) => {
    const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
    const expirationTime = 10000; // 10 seconds in milliseconds

    // Handle incoming socket events
    useEffect(() => {
        const listener = (event: NotificationEvent) => {
            setNotifications(prevState => {
                const currentTime = Date.now()

                // Remove expired notifications before adding a new one
                const filteredState = prevState.filter(
                    existingEvent => currentTime - (existingEvent.addedAt || 0) < expirationTime
                )

                // Check for duplicates
                const exists = filteredState.some(existingEvent =>
                    existingEvent.event === event.event &&
                    existingEvent.tokenId === event.tokenId &&
                    existingEvent.blockNumber === event.blockNumber
                )

                if (exists) {
                    return filteredState
                }

                // Add the new event
                const newEvent = {
                    ...event,
                    id: `${event.event}-${currentTime}`,
                    addedAt: currentTime,
                }

                return [...filteredState, newEvent].slice(-5)
            })
        }

        if (socket) {
            socket.on('flowbotsEvent', listener)
        }

        return () => {
            if (socket) {
                socket.off('flowbotsEvent', listener) // Cleanup on unmount
            }
        }
    }, [socket]) // Add socket as a dependency

    // Observe state changes for expired notifications
    useEffect(() => {
        const interval = setInterval(() => {
            setNotifications(prevState => {
                const currentTime = Date.now()

                // Remove expired notifications
                return prevState.filter(
                    notification => currentTime - (notification.addedAt || 0) < expirationTime
                )
            })
        }, 1000) // Check every second

        return () => clearInterval(interval) // Cleanup on unmount
    }, [])

    return (
        <Styled.Div>
            {notifications.map((note, i) => {
                return ['HighestBidIncreased', 'Birth', 'SaleSuccessful', 'SaleCreated'].includes(note.event) && (
                    <Styled.Toast key={note.id || i}>
                        {note.event === 'HighestBidIncreased' && (
                            <>
                                <img src={'/flowbots.png'} alt={'flowbot'} />
                                <p>
                                    {`New bid on Flowbot #${note.tokenId}`}
                                    <span>
                                        <Link to={`/flowbot/${note.tokenId}`}>
                                            {unPadAndFormatPrice(note.amount || '0')} by {note.from.slice(0, 20)}...
                                        </Link>
                                    </span>
                                </p>
                            </>
                        )}
                        {note.event === 'Birth' && (
                            <>
                                <img src={'/flowbots.png'} alt={'flowbot'} />
                                <p>
                                    {`Bidding now open on Flowbot #${note.tokenId}`}
                                    <span>
                                        <Link to={`/flowbot/${note.tokenId}`}>Click here to place your bid</Link>
                                    </span>
                                </p>
                            </>
                        )}
                        {note.event === 'SaleSuccessful' && (
                            <>
                                <img src={'/flowbots.png'} alt={'flowbot'} />
                                <p>
                                    {`Sale: Flowbot #${note.tokenId}`}
                                    <span>
                                        <Link to={`/flowbot/${note.tokenId}`}>
                                            {unPadAndFormatPrice(note.amount || '0')} by {note.owner?.slice(0, 20)}...
                                        </Link>
                                    </span>
                                </p>
                            </>
                        )}
                        {note.event === 'SaleCreated' && note.from !== Contracts.flowbots.auction.addr && (
                            <>
                                <img src={'/flowbots.png'} alt={'flowbot'} />
                                <p>
                                    {`Sale: Flowbot #${note.tokenId}`}
                                    <span>
                                        <Link to={`/flowbot/${note.tokenId}`}>
                                            {unPadAndFormatPrice(note.startPrice || '0')} by {note.from.slice(0, 20)}...
                                        </Link>
                                    </span>
                                </p>
                            </>
                        )}
                    </Styled.Toast>
                );
            })}
        </Styled.Div>
    )
}

export default Notifications