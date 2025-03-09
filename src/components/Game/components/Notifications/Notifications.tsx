// In src/components/Game/components/Notifications/Notifications.tsx
import { useState, useEffect } from 'react';
import { getAorAn, stables } from 'src/server/modules/chained-horse/config/stables';
import * as Styled from './Notifications.style';

interface NotificationData {
    // Generic interface for different notification types
    [key: string]: any;
}

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    icon: string;
    timestamp: string;
    data?: NotificationData;
    time? : number;
    record?: boolean;
    tokenId?: number;
    scanType?: string; // e.g. "background color"
    scanResult?: string; // e.g. "martini with alchohol"
    stable?: number; // e.g. stable_upgrade level 2
}

interface NotificationsProps {
    nfts: any[];
    notifications: Notification[];
    removeNotification: (id: string) => void;
    onNotificationAction?: (type: string, data: any) => void;
}

const Notifications: React.FC<NotificationsProps> = ({
    nfts,
    notifications,
    removeNotification,
    onNotificationAction
}) => {
    const [visibleNotifications, setVisibleNotifications] = useState<(Notification & { exiting?: boolean })[]>([]);

    useEffect(() => {
        // Add new notifications that aren't already in the visible list
        const newNotifications = notifications.filter(
            notification => !visibleNotifications.some(vn => vn.id === notification.id)
        );

        if (newNotifications.length > 0) {
            setVisibleNotifications(prev => [...prev, ...newNotifications]);
        }
    }, [notifications]);

    const handleClose = (id: string) => {
        // Mark as exiting for animation
        setVisibleNotifications(prev =>
            prev.map(notification =>
                notification.id === id
                    ? { ...notification, exiting: true }
                    : notification
            )
        );

        // Remove after animation completes
        setTimeout(() => {
            removeNotification(id);
            setVisibleNotifications(prev => prev.filter(notification => notification.id !== id));
        }, 300); // Match animation duration
    };

    const getIcon = (type: string, tokenId?: number) => {
        switch (type) {
            case 'stable_upgrade':
                return <div className={'stable'} style={{ backgroundImage: `url('/svg/stable.svg')` }} />;
                // return <div className={'horse'} style={{ backgroundImage: `url(${nfts.find(nft => nft.tokenId === tokenId).svg}`}} />
            case 'wasnt_scared':
                return <div className={'ghost'} style={{ backgroundImage: `url(${nfts.find(nft => nft.tokenId === 60).svg}`}} />;
            case 'spotted_by_ghost':
                return <div className={'ghost'} style={{ backgroundImage: `url(${nfts.find(nft => nft.tokenId === 60).svg}`}} />;
            case 'newbIslandRace':
                return <div className={'horse'} style={{ backgroundImage: `url(${nfts.find(nft => nft.tokenId === tokenId).svg}`}} />;
            // Add cases for other notification types as needed
            default:
                return '🔔';
        }
    };

    // Render additional content based on notification type
    const renderAdditionalContent = (notification: Notification) => {
        switch (notification.type) {
            case 'stable_upgrade':
                return notification.tokenId && notification.stable ? (
                    <Styled.Content>
                        <p><b>Horse #{notification.tokenId}</b> pimped their crib... and now resides in {getAorAn(stables[notification.stable])} <b>{stables[notification.stable]} stable</b></p>
                    </Styled.Content>
                ) : null;
            case 'spotted_by_ghost':
                return notification.tokenId && notification.scanType && notification.scanResult ? (
                    <Styled.Content>
                        <p><b>Horse #{notification.tokenId}</b> was spotted by a ghost who saw their <b>{notification.scanResult}  {formatNotificationType(notification.scanType).toLowerCase()}...</b></p>
                    </Styled.Content>
                ) : null;
            case 'wasnt_scared':
                return notification.tokenId ? (
                    <Styled.Content>
                        <p><b>Horse #{notification.tokenId}</b> ran through <b>Scare City</b> and wasn't scared...</p>
                    </Styled.Content>
                ) : null;
            case 'newbIslandRace':
                return notification.tokenId && notification.time ? (
                    notification.record ? (
                        <Styled.Content>
                            <p><b>Horse #{notification.tokenId}</b> set a new record in the <b>{formatNotificationType(notification.type)}</b> clocking in at <b>{notification.time / 1000}s</b></p>
                        </Styled.Content>
                    ) : (
                        <Styled.Content>
                            <p><b>Horse #{notification.tokenId}</b> won the <b>{formatNotificationType(notification.type)}</b> with a time of <b>{notification.time / 1000}s</b></p>
                        </Styled.Content>
                    )
                ) : null;
            // Add cases for other notification types as needed
            default:
                return null;
        }
    };

    const formatNotificationType = (str: string): string => 
        str.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase());

    // Auto-dismiss notifications after 10 seconds
    useEffect(() => {
        const timers = visibleNotifications.map(notification => {
            if (!notification.exiting) {
                return setTimeout(() => handleClose(notification.id), 10000);
            }
            return undefined;
        });

        return () => {
            timers.forEach(timer => timer && clearTimeout(timer));
        };
    }, [visibleNotifications]);

    return (
        <Styled.Container>
            {visibleNotifications.map((notification, i) => (
                <Styled.NotificationItem
                    key={i}
                    className={notification.exiting ? 'exiting' : ''}
                >
                    <Styled.Title>
                        {getIcon(notification.type, notification.tokenId)}
                    </Styled.Title>
                    {renderAdditionalContent(notification)}
                    <Styled.CloseButton onClick={() => handleClose(notification.id)}>×</Styled.CloseButton>
                </Styled.NotificationItem>
            ))}
        </Styled.Container>
    );
};

export default Notifications;