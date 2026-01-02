// In src/components/Game/components/Notifications/Notifications.tsx
import { useState, useEffect } from 'react';
import { getAorAn, stables } from 'src/server/modules/chained-horse/config/stables';
import { getAssetPath } from 'utils/assetPath';
import * as Styled from './Notifications.style';

const NOTIFICATION_DISPLAY_TIMEOUT = 10000

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
    reward?: string;
    direction?: string;
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
                return <div className={'stable'} style={{ backgroundImage: `url('${getAssetPath('svg/stable.svg')}')` }} />;
                // return <div className={'horse'} style={{ backgroundImage: `url(${nfts.find(nft => nft.tokenId === tokenId).svg}`}} />
            case 'wasnt_scared':
                return <div className={'ghost'} style={{ backgroundImage: `url(${nfts.find(nft => nft.tokenId === 60).svg}`}} />;
            case 'spotted_by_ghost':
                return <div className={'ghost'} style={{ backgroundImage: `url(${nfts.find(nft => nft.tokenId === 60).svg}`}} />;
            case 'newbIslandRace':
                return <div className={'horse'} style={{ backgroundImage: `url(${nfts.find(nft => nft.tokenId === tokenId).svg}`}} />;
            case 'greater_tractor_vote':
                return <div className={'horse'} style={{ backgroundImage: `url(${nfts.find(nft => nft.tokenId === tokenId).svg}`}} />;
            case 'greater_tractor_vote_change':
                return <div className={'horse'} style={{ backgroundImage: `url(${nfts.find(nft => nft.tokenId === tokenId).svg}`}} />;
            case 'greater_tractor_win':
                return <div className={'tractor'}>🚜</div>;
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
                        <p><b>Horse #{notification.tokenId}</b> was <b>spooked by a ghost</b> who spotted their <b>{notification.scanResult} {formatNotificationType(notification.scanType).toLowerCase()}...</b></p>
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
                            <p><b>Horse #{notification.tokenId}</b> set a new record in the <b>{formatNotificationType(notification.type)}</b> with a time of <b>{notification.time / 1000}s</b></p>
                        </Styled.Content>
                    ) : (
                        <Styled.Content>
                            <p><b>Horse #{notification.tokenId}</b> won the <b>{formatNotificationType(notification.type)}</b> with a time of <b>{notification.time / 1000}s</b></p>
                        </Styled.Content>
                    )
                ) : null;
            case 'greater_tractor_vote_change':
                return (
                    <Styled.Content>
                        <p><b>Horse #{notification.tokenId}</b> changed their vote for the Greater Tractor.</p>
                    </Styled.Content>
                )
            case 'greater_tractor_vote':
                return (
                    <Styled.Content>
                        <p><b>Horse #{notification.tokenId}</b> voted for the Greater Tractor.</p>
                    </Styled.Content>
                )
            case 'greater_tractor_win':
                return notification.reward && (
                    <Styled.Content>
                        <p><b>{notification.reward}</b> has been distributed to those who voted for the Greater Tractor</p>
                    </Styled.Content>
                )
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
                return setTimeout(() => handleClose(notification.id), NOTIFICATION_DISPLAY_TIMEOUT);
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